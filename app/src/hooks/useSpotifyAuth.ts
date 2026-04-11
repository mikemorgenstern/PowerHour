import { useState, useEffect, useCallback } from 'react';
import { getStoredToken, redirectToSpotifyAuth, logout as authLogout } from '../spotify/auth';
import { getUserProfile } from '../spotify/api';
import { useSpotifyStore } from '../stores/spotifyStore';

interface UseSpotifyAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

/**
 * Manages Spotify auth state on mount:
 *  - Checks for a stored (and still valid) token
 *  - Fetches the user profile and pushes it into the Spotify store
 *  - Exposes login / logout helpers
 */
export function useSpotifyAuth(): UseSpotifyAuthResult {
  const [isLoading, setIsLoading] = useState(true);

  const accessToken = useSpotifyStore((s) => s.accessToken);
  const setToken = useSpotifyStore((s) => s.setToken);
  const setProfile = useSpotifyStore((s) => s.setProfile);
  const storeLogout = useSpotifyStore((s) => s.logout);

  // On mount, attempt to restore a session from localStorage
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const token = await getStoredToken();
        if (cancelled) return;

        if (!token) {
          setIsLoading(false);
          return;
        }

        setToken(token);

        // Fetch user profile to populate store
        const profile = await getUserProfile();
        if (cancelled) return;

        setProfile({
          userId: profile.id,
          displayName: profile.display_name,
          isPremium: profile.product === 'premium',
        });
      } catch {
        // Token was invalid or network error — stay logged out
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async () => {
    await redirectToSpotifyAuth();
  }, []);

  const logout = useCallback(() => {
    authLogout();
    storeLogout();
  }, [storeLogout]);

  return {
    isAuthenticated: accessToken !== null,
    isLoading,
    login,
    logout,
  };
}
