// Raw Spotify API response types used internally by the API client.
// These mirror Spotify's Web API responses and are mapped to our
// domain types (Track, SpotifyPlaylist) before leaving this layer.

export interface SpotifyImageResponse {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyArtistBrief {
  id: string;
  name: string;
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyAlbumResponse {
  id: string;
  name: string;
  images: SpotifyImageResponse[];
  release_date: string;
  album_type: string;
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyTrackResponse {
  id: string;
  name: string;
  artists: SpotifyArtistBrief[];
  album: SpotifyAlbumResponse;
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  explicit: boolean;
  popularity: number;
  track_number: number;
  is_local: boolean;
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyPlaylistTrackItem {
  added_at: string;
  added_by: {
    id: string;
    external_urls: SpotifyExternalUrls;
  };
  is_local: boolean;
  /** @deprecated Spotify renamed this to `item` */
  track?: SpotifyTrackResponse | null;
  /** New Spotify API field (was `track`) */
  item?: SpotifyTrackResponse | null;
}

export interface SpotifyPaginatedResponse<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string;
  images: SpotifyImageResponse[];
  owner: {
    id: string;
    display_name: string;
    external_urls: SpotifyExternalUrls;
  };
  tracks: SpotifyPaginatedResponse<SpotifyPlaylistTrackItem>;
  public: boolean;
  collaborative: boolean;
  external_urls: SpotifyExternalUrls;
  snapshot_id: string;
}

/** Simplified playlist object returned when listing user playlists.
 *  NOTE: Spotify API now returns `items` instead of `tracks` for the
 *  track count/href — we support both for backwards compatibility. */
export interface SpotifyPlaylistBriefResponse {
  id: string;
  name: string;
  description: string;
  images: SpotifyImageResponse[];
  owner: {
    id: string;
    display_name: string;
    external_urls: SpotifyExternalUrls;
  };
  /** @deprecated Spotify renamed this to `items` — check items first */
  tracks?: {
    total: number;
    href: string;
  };
  /** New Spotify API field (was `tracks`) */
  items?: {
    total: number;
    href: string;
  };
  public: boolean;
  collaborative: boolean;
  external_urls: SpotifyExternalUrls;
  snapshot_id: string;
}

export interface SpotifyAudioFeaturesResponse {
  id: string;
  energy: number; // 0.0 - 1.0
  tempo: number; // BPM
  danceability: number; // 0.0 - 1.0
  valence: number; // 0.0 - 1.0 (musical positiveness)
  loudness: number; // dB (typically -60 to 0)
  speechiness: number; // 0.0 - 1.0
  acousticness: number; // 0.0 - 1.0
  instrumentalness: number; // 0.0 - 1.0
  liveness: number; // 0.0 - 1.0
  key: number; // 0-11 (pitch class)
  mode: number; // 0 = minor, 1 = major
  time_signature: number;
  duration_ms: number;
  analysis_url: string;
  track_href: string;
  uri: string;
  type: string;
}

export interface SpotifyAudioFeaturesBatchResponse {
  audio_features: (SpotifyAudioFeaturesResponse | null)[];
}

export interface SpotifyUserProfileResponse {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImageResponse[];
  product: 'premium' | 'free' | 'open';
  country: string;
  external_urls: SpotifyExternalUrls;
  followers: {
    total: number;
  };
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrackResponse[];
  seeds: SpotifyRecommendationSeed[];
}

export interface SpotifyRecommendationSeed {
  id: string;
  type: 'track' | 'artist' | 'genre';
  initialPoolSize: number;
  afterFilteringSize: number;
  afterRelinkingSize: number;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  refresh_token?: string;
  scope: string;
}

export interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}
