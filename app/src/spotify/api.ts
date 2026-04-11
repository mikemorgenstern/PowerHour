import type { Track, SpotifyPlaylist } from '../types/game';
import { getStoredToken, refreshAccessToken } from './auth';
import type {
  SpotifyAudioFeaturesBatchResponse,
  SpotifyAudioFeaturesResponse,
  SpotifyPaginatedResponse,
  SpotifyPlaylistBriefResponse,
  SpotifyPlaylistTrackItem,
  SpotifyRecommendationsResponse,
  SpotifyTrackResponse,
  SpotifyUserProfileResponse,
} from './types';

const BASE_URL = 'https://api.spotify.com/v1';

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Fetch wrapper that automatically attaches the Spotify auth header.
 * On a 401 response it will attempt a single token refresh and retry.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const token = await getStoredToken();
  if (!token) {
    throw new Error('Not authenticated — no valid Spotify token available.');
  }

  const headers = new Headers(options.headers);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const doFetch = (t: string) => {
    headers.set('Authorization', `Bearer ${t}`);
    return fetch(url, { ...options, headers, signal: controller.signal });
  };

  let response: Response;
  try {
    response = await doFetch(token);

    // Attempt one transparent retry on 401 (expired token)
    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        response = await doFetch(newToken);
      } catch {
        throw new Error('Authentication expired and refresh failed. Please log in again.');
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out — check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error');
    console.error(`[Spotify API] ${response.status} on ${url}:`, errorBody);
    const path = url.replace('https://api.spotify.com/v1', '');
    if (response.status === 403 && path.includes('/tracks')) {
      const grantedScopes = localStorage.getItem('spotify_granted_scopes') ?? '(unknown)';
      console.error(`[Spotify API] 403 on playlist tracks. Granted scopes: ${grantedScopes}`);
      throw new Error(`403: This playlist's tracks can't be accessed. It may be a Spotify-curated playlist (e.g. Discover Weekly, Daily Mix) that blocks third-party access, or the token is missing the playlist-read-private scope. Granted scopes: ${grantedScopes}`);
    }
    throw new Error(`Spotify API error ${response.status} on ${path}: ${errorBody}`);
  }

  return response;
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's Spotify profile.
 * Use `profile.product === 'premium'` to check Premium status.
 */
export async function getUserProfile(): Promise<SpotifyUserProfileResponse> {
  const response = await fetchWithAuth(`${BASE_URL}/me`);
  return response.json();
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's playlists (paginated).
 * Returns playlists mapped to the app's SpotifyPlaylist type.
 */
export async function getUserPlaylists(
  limit = 50,
  offset = 0,
): Promise<{ playlists: SpotifyPlaylist[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
  });

  const response = await fetchWithAuth(`${BASE_URL}/me/playlists?${params}`);
  const data: SpotifyPaginatedResponse<SpotifyPlaylistBriefResponse> = await response.json();

  const playlists = (data.items ?? [])
    .filter((item): item is SpotifyPlaylistBriefResponse => item != null)
    .map(mapPlaylist);

  return { playlists, total: data.total ?? 0 };
}

/**
 * Fetch ALL tracks from a playlist, handling Spotify's pagination automatically.
 * Returns tracks mapped to the app's Track type.
 */
export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const tracks: Track[] = [];
  // Spotify API renamed /tracks → /items; try /items first, fall back to /tracks
  let url: string | null = `${BASE_URL}/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const response = await fetchWithAuth(url);
    const data: SpotifyPaginatedResponse<SpotifyPlaylistTrackItem> = await response.json();

    for (const item of data.items ?? []) {
      if (!item) continue;
      // Spotify renamed `track` → `item` in playlist item responses
      const trackData = item.item ?? item.track;
      if (!trackData) continue;
      const track = trackData as SpotifyTrackResponse;
      if (item.is_local || track.is_local) continue;
      // Skip podcast episodes (they lack the standard track fields)
      if (!track.artists) continue;
      tracks.push(mapTrack(track));
    }

    url = data.next;
  }

  return tracks;
}

// ---------------------------------------------------------------------------
// Audio features
// ---------------------------------------------------------------------------

/**
 * Batch-fetch audio features for an array of track IDs.
 * The Spotify API limits to 100 IDs per request, so this function
 * automatically chunks larger arrays.
 *
 * Returns a Map from track ID to its audio features (missing entries
 * mean the API had no data for that track).
 */
export async function getAudioFeatures(
  trackIds: string[],
): Promise<Map<string, SpotifyAudioFeaturesResponse>> {
  const result = new Map<string, SpotifyAudioFeaturesResponse>();
  const CHUNK_SIZE = 100;

  for (let i = 0; i < trackIds.length; i += CHUNK_SIZE) {
    const chunk = trackIds.slice(i, i + CHUNK_SIZE);
    const ids = chunk.join(',');
    const response = await fetchWithAuth(`${BASE_URL}/audio-features?ids=${ids}`);
    const data: SpotifyAudioFeaturesBatchResponse = await response.json();

    for (const features of data.audio_features) {
      if (features) {
        result.set(features.id, features);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Liked Songs (uses user-library-read — works even without playlist scopes)
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's saved/liked tracks.
 * This is the most reliable track source since it only needs user-library-read.
 */
export async function getLikedSongs(limit = 50, offset = 0): Promise<{ tracks: Track[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
  });
  const response = await fetchWithAuth(`${BASE_URL}/me/tracks?${params}`);
  const data: SpotifyPaginatedResponse<SpotifyPlaylistTrackItem> = await response.json();
  const tracks: Track[] = [];
  for (const entry of data.items ?? []) {
    // Handle both `track` (current /me/tracks format) and `item` (if Spotify renames it)
    const trackData = entry.item ?? entry.track;
    if (!trackData) continue;
    const t = trackData as SpotifyTrackResponse;
    if (t.is_local) continue;
    if (!t.artists) continue;
    tracks.push(mapTrack(t));
  }
  return { tracks, total: data.total ?? 0 };
}

// ---------------------------------------------------------------------------
// Top tracks (used as recommendation seeds when playlists aren't accessible)
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's top tracks (requires user-top-read scope).
 * Useful as seed tracks for recommendations when playlist tracks are inaccessible.
 */
export async function getUserTopTracks(limit = 20, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<Track[]> {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    time_range: timeRange,
  });
  const response = await fetchWithAuth(`${BASE_URL}/me/top/tracks?${params}`);
  const data: SpotifyPaginatedResponse<SpotifyTrackResponse> = await response.json();
  return (data.items ?? []).map(mapTrack);
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/**
 * Get track recommendations based on seed tracks.
 * Spotify allows up to 5 seed values total (tracks + artists + genres).
 */
export async function getRecommendations(
  seedTrackIds: string[],
  limit = 60,
): Promise<Track[]> {
  // Spotify caps at 5 seeds total
  const seeds = seedTrackIds.slice(0, 5).join(',');

  const params = new URLSearchParams({
    seed_tracks: seeds,
    limit: String(Math.min(limit, 100)),
  });

  const response = await fetchWithAuth(`${BASE_URL}/recommendations?${params}`);
  const data: SpotifyRecommendationsResponse = await response.json();

  return data.tracks.map(mapTrack);
}

// ---------------------------------------------------------------------------
// Mappers — Spotify API responses -> app domain types
// ---------------------------------------------------------------------------

function mapTrack(raw: SpotifyTrackResponse): Track {
  const images = raw.album.images ?? [];

  // Spotify returns images sorted largest-first, but let's be safe
  const sorted = [...images].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0),
  );
  const largest = sorted[0]?.url ?? '';
  const smallest = sorted[sorted.length - 1]?.url ?? largest;

  return {
    id: raw.id,
    name: raw.name,
    artist: raw.artists.map((a) => a.name).join(', '),
    albumName: raw.album.name,
    albumArt: largest,
    albumArtSmall: smallest,
    durationMs: raw.duration_ms,
    previewUrl: raw.preview_url,
    uri: raw.uri,
    clipStartMs: 0, // Game engine will compute smart start positions later
  };
}

function mapPlaylist(raw: SpotifyPlaylistBriefResponse): SpotifyPlaylist {
  // Spotify API renamed `tracks` → `items` — support both
  const trackInfo = raw.items ?? raw.tracks;
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.images?.[0]?.url ?? '',
    trackCount: trackInfo?.total ?? 0,
    owner: raw.owner?.display_name ?? raw.owner?.id ?? 'Unknown',
    ownerId: raw.owner?.id ?? '',
  };
}
