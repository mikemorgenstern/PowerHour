import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUserPlaylists, getPlaylistTracks, getUserTopTracks, getLikedSongs, getUserProfile } from '../../spotify/api';
import { awaitPrefetch } from '../../spotify/prefetch';
import { useSpotifyStore } from '../../stores/spotifyStore';
import { useGameStore } from '../../stores/gameStore';
import type { SpotifyPlaylist, Track } from '../../types/game';
import Spinner from '../shared/Spinner';

// ---------------------------------------------------------------------------
// Playlist cache (sessionStorage) — instant on return visits
// ---------------------------------------------------------------------------

const PLAYLIST_CACHE_KEY = 'ph_playlists_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PlaylistCache {
  playlists: SpotifyPlaylist[];
  totalFollowed: number;
  timestamp: number;
  userId: string;
}

function getCachedPlaylists(userId: string): PlaylistCache | null {
  try {
    const raw = sessionStorage.getItem(PLAYLIST_CACHE_KEY);
    if (!raw) return null;
    const cache: PlaylistCache = JSON.parse(raw);
    if (cache.userId !== userId || Date.now() - cache.timestamp > CACHE_TTL_MS) return null;
    return cache;
  } catch { return null; }
}

function setCachedPlaylists(data: PlaylistCache): void {
  try { sessionStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(data)); }
  catch { /* quota exceeded */ }
}

// ---------------------------------------------------------------------------
// Skeleton card shown while playlists are loading
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-surface-light p-3">
      <div className="aspect-square w-full rounded-lg bg-surface-lighter" />
      <div className="mt-3 h-4 w-3/4 rounded bg-surface-lighter" />
      <div className="mt-2 h-3 w-1/2 rounded bg-surface-lighter" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Mix card
// ---------------------------------------------------------------------------

interface QuickMixCardProps {
  loading: boolean;
  onClick: () => void;
}

function QuickMixCard({ loading, onClick }: QuickMixCardProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neon-purple/40 bg-surface-light p-3 text-left transition-colors hover:border-neon-purple/70 hover:bg-surface-lighter disabled:cursor-wait disabled:opacity-60"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
        {loading ? (
          <Spinner size="md" />
        ) : (
          <svg
            className="h-12 w-12 text-neon-purple"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
            />
          </svg>
        )}
        <span className="text-sm font-semibold text-neon-purple">
          {loading ? 'Building mix...' : 'Quick Mix'}
        </span>
      </div>
      <p className="mt-3 w-full truncate text-sm font-semibold text-text-primary">
        Quick Mix
      </p>
      <p className="mt-1 text-xs text-text-secondary">Auto-generated party mix</p>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Single playlist card
// ---------------------------------------------------------------------------

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  loading: boolean;
  onClick: () => void;
}

const PlaylistCard = memo(function PlaylistCard({ playlist, loading, onClick }: PlaylistCardProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className="group cursor-pointer rounded-xl bg-surface-light p-3 text-left transition-colors hover:bg-surface-lighter disabled:cursor-wait disabled:opacity-60"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-lighter">
        {playlist.imageUrl ? (
          <img
            src={playlist.imageUrl}
            alt={playlist.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-text-secondary/40"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
              />
            </svg>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Spinner size="md" />
          </div>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-text-primary">
        {playlist.name}
      </p>
      <p className="mt-1 text-xs text-text-secondary">
        {playlist.trackCount} track{playlist.trackCount !== 1 ? 's' : ''}
      </p>
    </motion.button>
  );
});

// ---------------------------------------------------------------------------
// Liked Songs card
// ---------------------------------------------------------------------------

interface LikedSongsCardProps {
  loading: boolean;
  onClick: () => void;
}

function LikedSongsCard({ loading, onClick }: LikedSongsCardProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neon-blue/40 bg-surface-light p-3 text-left transition-colors hover:border-neon-blue/70 hover:bg-surface-lighter disabled:cursor-wait disabled:opacity-60"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-green/20">
        {loading ? (
          <Spinner size="md" />
        ) : (
          <svg
            className="h-12 w-12 text-neon-blue"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        )}
        <span className="text-sm font-semibold text-neon-blue">
          {loading ? 'Loading...' : 'Liked Songs'}
        </span>
      </div>
      <p className="mt-3 w-full truncate text-sm font-semibold text-text-primary">
        Liked Songs
      </p>
      <p className="mt-1 text-xs text-text-secondary">Your saved tracks</p>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main PlaylistPicker
// ---------------------------------------------------------------------------

export default function PlaylistPicker() {
  const navigate = useNavigate();
  const displayName = useSpotifyStore((s) => s.displayName);
  const userId = useSpotifyStore((s) => s.userId);
  const setProfile = useSpotifyStore((s) => s.setProfile);
  const setTracks = useGameStore((s) => s.setTracks);

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [totalFollowed, setTotalFollowed] = useState(0); // how many playlists were hidden
  const [loading, setLoading] = useState(true);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [quickMixLoading, setQuickMixLoading] = useState(false);
  const [likedSongsLoading, setLikedSongsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch playlists on mount — cache first, then parallel fetch
  useEffect(() => {
    let cancelled = false;

    async function fetchPlaylists() {
      try {
        // Ensure we have userId (may be null if user navigated directly to /select)
        let resolvedUserId = userId;
        if (!resolvedUserId) {
          try {
            const profile = await getUserProfile();
            setProfile({ userId: profile.id, displayName: profile.display_name, isPremium: profile.product === 'premium' });
            resolvedUserId = profile.id;
          } catch { /* auth will redirect to login */ }
        }

        // If a prefetch is in flight (started during auth), wait for it
        await awaitPrefetch();

        // Check cache (populated by prefetch or previous visit)
        const cached = resolvedUserId ? getCachedPlaylists(resolvedUserId) : null;
        if (cached) {
          if (!cancelled) {
            setPlaylists(cached.playlists);
            setTotalFollowed(cached.totalFollowed);
            setLoading(false);
          }
          return; // Cache is fresh — done
        }

        setLoading(true);

        // Page 1 — render immediately (progressive rendering)
        const first = await getUserPlaylists(50, 0);
        const total = first.total;

        if (!cancelled) {
          const ownedFirst = first.playlists.filter(p => p.ownerId === resolvedUserId);
          setPlaylists(ownedFirst);
          setTotalFollowed(first.playlists.length - ownedFirst.length);
          setLoading(false); // Show first batch NOW
        }

        // Remaining pages — fire ALL in parallel
        if (total > 50) {
          const offsets: number[] = [];
          for (let o = 50; o < total; o += 50) offsets.push(o);

          const remaining = await Promise.all(
            offsets.map(o => getUserPlaylists(50, o))
          );

          if (!cancelled) {
            const allRemaining = remaining.flatMap(r => r.playlists);
            const ownedRemaining = allRemaining.filter(p => p.ownerId === resolvedUserId);
            const followedRemaining = allRemaining.length - ownedRemaining.length;

            setPlaylists(prev => [...prev, ...ownedRemaining]);
            setTotalFollowed(prev => prev + followedRemaining);

            // Cache the complete result
            if (resolvedUserId) {
              const allOwned = [...first.playlists.filter(p => p.ownerId === resolvedUserId), ...ownedRemaining];
              const totalFollowedFinal = (first.playlists.length - first.playlists.filter(p => p.ownerId === resolvedUserId).length) + followedRemaining;
              setCachedPlaylists({
                playlists: allOwned,
                totalFollowed: totalFollowedFinal,
                timestamp: Date.now(),
                userId: resolvedUserId,
              });
            }
          }
        } else if (!cancelled && resolvedUserId) {
          // Only 1 page — cache it
          const owned = first.playlists.filter(p => p.ownerId === resolvedUserId);
          setCachedPlaylists({
            playlists: owned,
            totalFollowed: first.playlists.length - owned.length,
            timestamp: Date.now(),
            userId: resolvedUserId!,
          });
        }

        if (!cancelled) {
          // Check if we ended up with 0 playlists
          setPlaylists(prev => {
            if (prev.length === 0) {
              setError('No playlists found that you own. Create some playlists on Spotify, or use Liked Songs / Quick Mix.');
            }
            return prev;
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load playlists');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlaylists();
    return () => { cancelled = true; };
  }, [userId]);

  // Filtered playlists
  const filtered = useMemo(() => {
    if (!search.trim()) return playlists;
    const q = search.toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, search]);

  // Select a playlist
  const handleSelectPlaylist = async (playlist: SpotifyPlaylist) => {
    if (loadingPlaylistId || quickMixLoading) return;
    setError(null);
    setLoadingPlaylistId(playlist.id);

    try {
      const tracks = await getPlaylistTracks(playlist.id);
      if (tracks.length === 0) {
        setError(`No playable tracks found in "${playlist.name}". Try a different playlist.`);
        setLoadingPlaylistId(null);
        return;
      }
      setTracks(tracks);
      navigate('/settings');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load playlist tracks';
      // 403 on playlist tracks = Spotify-curated playlist or missing scope
      if (msg.includes('403')) {
        setError(`"${playlist.name}" can't be accessed — it may be a Spotify-curated playlist (Discover Weekly, Daily Mix, etc.) that blocks third-party apps. Try one of your own playlists or use Quick Mix.`);
      } else {
        setError(msg);
      }
      setLoadingPlaylistId(null);
    }
  };

  // Liked Songs — parallel fetch, most reliable
  const handleLikedSongs = useCallback(async () => {
    if (loadingPlaylistId || quickMixLoading || likedSongsLoading) return;
    setError(null);
    setLikedSongsLoading(true);

    try {
      // First page to get total
      const first = await getLikedSongs(50, 0);
      const allTracks: Track[] = [...first.tracks];

      // Remaining pages in parallel (up to 200 tracks total)
      if (first.total > 50 && allTracks.length < 200) {
        const offsets: number[] = [];
        for (let o = 50; o < Math.min(first.total, 200); o += 50) offsets.push(o);
        const pages = await Promise.all(offsets.map(o => getLikedSongs(50, o)));
        for (const page of pages) allTracks.push(...page.tracks);
      }

      if (allTracks.length === 0) {
        setError('No liked songs found. Save some songs on Spotify first, or try Quick Mix.');
        setLikedSongsLoading(false);
        return;
      }

      const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
      setTracks(shuffled.slice(0, 80));
      navigate('/settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load liked songs');
      setLikedSongsLoading(false);
    }
  }, [loadingPlaylistId, quickMixLoading, likedSongsLoading, setTracks, navigate]);

  // Quick Mix — combines top tracks + liked songs into a shuffled party mix
  const handleQuickMix = async () => {
    if (loadingPlaylistId || quickMixLoading) return;
    setQuickMixLoading(true);

    try {
      const allTracks: Track[] = [];
      const seenIds = new Set<string>();

      const addUnique = (tracks: Track[]) => {
        for (const t of tracks) {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            allTracks.push(t);
          }
        }
      };

      // Source 1: top tracks (short + medium term for variety)
      const [shortTerm, mediumTerm] = await Promise.allSettled([
        getUserTopTracks(50, 'short_term'),
        getUserTopTracks(50, 'medium_term'),
      ]);
      if (shortTerm.status === 'fulfilled') addUnique(shortTerm.value);
      if (mediumTerm.status === 'fulfilled') addUnique(mediumTerm.value);

      // Source 2: liked songs (fill remaining slots)
      if (allTracks.length < 80) {
        try {
          const liked = await getLikedSongs(50, 0);
          addUnique(liked.tracks);
        } catch { /* optional */ }
      }

      if (allTracks.length === 0) {
        setError('No tracks found for Quick Mix. Try Liked Songs or a playlist instead.');
        setQuickMixLoading(false);
        return;
      }

      // Shuffle and cap at 80
      const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
      setTracks(shuffled.slice(0, 80));
      navigate('/settings');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate Quick Mix',
      );
      setQuickMixLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Choose Your Playlist
          </h1>
          {displayName && (
            <p className="mt-1 text-text-secondary">
              Hey{' '}
              <span className="font-medium text-neon-blue">{displayName}</span>,
              pick the vibe for tonight
            </p>
          )}
        </motion.div>

        {/* Search bar */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter playlists..."
              className="w-full rounded-xl border border-surface-lighter bg-surface-light py-3 pl-10 pr-4 text-text-primary placeholder-text-secondary outline-none transition-colors focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/30"
            />
          </div>
        </motion.div>

        {/* Followed playlists note */}
        {totalFollowed > 0 && !loading && (
          <motion.p
            className="mt-3 text-xs text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {totalFollowed} followed playlist{totalFollowed !== 1 ? 's' : ''} hidden — only playlists you created are accessible.
          </motion.p>
        )}

        {/* Error banner */}
        {error && (
          <motion.div
            className="mt-4 rounded-lg bg-neon-pink/10 px-4 py-3 text-sm text-neon-pink"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setError(null)}
                className="cursor-pointer font-semibold underline hover:no-underline"
              >
                Dismiss
              </button>
              <button
                onClick={() => { import('../../spotify/auth').then(m => { m.logout(); window.location.href = '/login'; }); }}
                className="cursor-pointer font-semibold underline hover:no-underline"
              >
                Reconnect Spotify
              </button>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <motion.div
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {/* Quick actions — always first */}
          {!loading && (
            <>
              <LikedSongsCard loading={likedSongsLoading} onClick={handleLikedSongs} />
              <QuickMixCard loading={quickMixLoading} onClick={handleQuickMix} />
            </>
          )}

          {/* Loading skeletons */}
          {loading &&
            Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}

          {/* Playlist cards */}
          {!loading &&
            filtered.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                loading={loadingPlaylistId === playlist.id}
                onClick={() => handleSelectPlaylist(playlist)}
              />
            ))}
        </motion.div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && search.trim() && (
          <p className="mt-12 text-center text-text-secondary">
            No playlists match "{search}"
          </p>
        )}

        {!loading && playlists.length === 0 && !search.trim() && (
          <p className="mt-12 text-center text-text-secondary">
            No playlists found on your Spotify account.
            <br />
            Create some playlists on Spotify and come back!
          </p>
        )}
      </div>
    </div>
  );
}
