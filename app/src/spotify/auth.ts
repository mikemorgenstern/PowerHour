import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES } from '../config/spotify';
import type { SpotifyTokenResponse } from './types';

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  tokenExpiry: 'spotify_token_expiry',
  codeVerifier: 'spotify_code_verifier',
} as const;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random code verifier (43-128 chars, URL-safe).
 */
export function generateCodeVerifier(length = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Derive the S256 code challenge from a code verifier.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/** Base64-URL encode a byte array (no padding). */
function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Auth flow
// ---------------------------------------------------------------------------

/**
 * Build the Spotify authorization URL and redirect the browser.
 * Clears any existing tokens first to guarantee a fresh auth with
 * the current full scope list.
 * Stores the PKCE code verifier in localStorage so we can use it
 * when exchanging the auth code.
 */
export async function redirectToSpotifyAuth(): Promise<void> {
  // Clear any existing tokens before starting a fresh auth flow.
  // This ensures stale tokens (possibly missing scopes) are never reused.
  logout();

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem(STORAGE_KEYS.codeVerifier, verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'true', // Always show consent screen to ensure fresh token with correct scopes
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access & refresh tokens.
 * Should be called on the /callback page after Spotify redirects back.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const verifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);
  if (!verifier) {
    throw new Error('Missing PKCE code verifier — did the auth flow start correctly?');
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_verifier: verifier,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  storeTokenData(data);

  // Clean up the verifier — it's single-use
  localStorage.removeItem(STORAGE_KEYS.codeVerifier);

  return data.access_token;
}

/**
 * Use the stored refresh token to obtain a new access token.
 * Returns the new access token, or throws if no refresh token is available.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) {
    throw new Error('No refresh token available — user must re-authenticate.');
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    // If refresh fails, clear tokens so the user is prompted to re-auth
    logout();
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  storeTokenData(data);

  return data.access_token;
}

/**
 * Return a valid access token. If the stored token is expired (or about to
 * expire within 60 seconds), it will be refreshed automatically.
 * Returns null if no token is stored at all.
 */
export async function getStoredToken(): Promise<string | null> {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  const expiryStr = localStorage.getItem(STORAGE_KEYS.tokenExpiry);

  if (!token || !expiryStr) {
    return null;
  }

  const expiryMs = Number(expiryStr);
  const bufferMs = 60_000; // refresh 60s before actual expiry

  if (Date.now() >= expiryMs - bufferMs) {
    try {
      return await refreshAccessToken();
    } catch {
      // Refresh failed — caller should handle re-auth
      return null;
    }
  }

  return token;
}

/**
 * Clear all stored Spotify auth data.
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.tokenExpiry);
  localStorage.removeItem(STORAGE_KEYS.codeVerifier);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function storeTokenData(data: SpotifyTokenResponse): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token);

  if (data.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token);
  }

  // Store the absolute expiry timestamp (ms)
  const expiresAtMs = Date.now() + data.expires_in * 1000;
  localStorage.setItem(STORAGE_KEYS.tokenExpiry, String(expiresAtMs));

  // Log granted scopes for diagnostics
  if (data.scope) {
    localStorage.setItem('spotify_granted_scopes', data.scope);
    console.log('[Auth] Granted scopes:', data.scope);
    const needed = ['playlist-read-private', 'playlist-read-collaborative', 'user-library-read'];
    const missing = needed.filter(s => !data.scope.includes(s));
    if (missing.length > 0) {
      console.warn('[Auth] WARNING — missing scopes:', missing.join(', '));
    }
  }
}
