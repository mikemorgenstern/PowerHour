import { getUserPlaylists } from './api';
import type { SpotifyPlaylist } from '../types/game';

const PLAYLIST_CACHE_KEY = 'ph_playlists_cache';

interface PlaylistCache {
  playlists: SpotifyPlaylist[];
  totalFollowed: number;
  timestamp: number;
  userId: string;
}

/** In-flight prefetch promise — lets PlaylistPicker await it instead of re-fetching. */
let inflight: Promise<void> | null = null;

/**
 * Start playlist prefetch. Returns immediately.
 * Call `awaitPrefetch()` from PlaylistPicker to wait for it.
 */
export function prefetchPlaylists(userId: string): void {
  inflight = (async () => {
    try {
      // Page 1
      const first = await getUserPlaylists(50, 0);
      const total = first.total;
      const allPlaylists: SpotifyPlaylist[] = [...first.playlists];

      // Remaining pages in parallel
      if (total > 50) {
        const offsets: number[] = [];
        for (let o = 50; o < total; o += 50) offsets.push(o);
        const remaining = await Promise.all(
          offsets.map(o => getUserPlaylists(50, o))
        );
        for (const page of remaining) {
          allPlaylists.push(...page.playlists);
        }
      }

      const owned = allPlaylists.filter(p => p.ownerId === userId);
      const totalFollowed = allPlaylists.length - owned.length;

      const cache: PlaylistCache = {
        playlists: owned,
        totalFollowed,
        timestamp: Date.now(),
        userId,
      };

      sessionStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(cache));
      console.log(`[Prefetch] Cached ${owned.length} playlists (${totalFollowed} followed hidden)`);
    } catch (e) {
      console.warn('[Prefetch] Playlist prefetch failed (non-blocking):', e);
    } finally {
      inflight = null;
    }
  })();
}

/**
 * If a prefetch is in flight, wait for it (max 5s).
 * Returns true if a prefetch completed, false if none was running or it timed out.
 */
export async function awaitPrefetch(): Promise<boolean> {
  if (!inflight) return false;
  try {
    await Promise.race([
      inflight,
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);
    return true;
  } catch {
    return false;
  }
}
