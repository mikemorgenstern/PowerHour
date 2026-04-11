import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../../spotify/auth';
import { getUserProfile } from '../../spotify/api';
import { useSpotifyStore } from '../../stores/spotifyStore';
import { prefetchPlaylists } from '../../spotify/prefetch';
import Spinner from '../shared/Spinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  const setToken = useSpotifyStore((s) => s.setToken);
  const setProfile = useSpotifyStore((s) => s.setProfile);

  useEffect(() => {
    // Prevent double-execution in StrictMode
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Spotify authorization denied: ${authError}`);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    if (!code) {
      setError('No authorization code received from Spotify.');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    async function handleAuth(authCode: string) {
      try {
        const accessToken = await exchangeCodeForToken(authCode);
        setToken(accessToken);

        const profile = await getUserProfile();

        setProfile({
          userId: profile.id,
          displayName: profile.display_name,
          isPremium: profile.product === 'premium',
        });

        // Fire-and-forget: prefetch all playlists while we navigate
        prefetchPlaylists(profile.id);

        navigate('/select', { replace: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Authentication failed';
        setError(message);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    }

    handleAuth(code);
  }, [searchParams, navigate, setToken, setProfile]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4">
      {error ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neon-pink/15">
            <svg
              className="h-7 w-7 text-neon-pink"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-text-primary">{error}</p>
          <p className="text-sm text-text-secondary">Redirecting to login...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg font-medium text-text-primary">
            Connecting to Spotify...
          </p>
          <p className="text-sm text-text-secondary">
            Hang tight, setting things up
          </p>
        </div>
      )}
    </div>
  );
}
