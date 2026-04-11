import { test, expect, type Page, type Route } from '@playwright/test';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TOKEN = 'mock_access_token_12345';
const MOCK_EXPIRY = String(Date.now() + 3600 * 1000);

const MOCK_PROFILE = {
  id: 'testuser',
  display_name: 'Test User',
  email: 'test@test.com',
  product: 'premium',
  images: [],
  country: 'US',
  external_urls: { spotify: '' },
  followers: { total: 0 },
};

const MOCK_TRACK = (i: number) => ({
  id: `track${i}`,
  name: `Song ${i}`,
  artists: [{ id: `artist${i}`, name: `Artist ${i}`, external_urls: { spotify: '' } }],
  album: {
    id: `album${i}`,
    name: `Album ${i}`,
    images: [
      { url: `https://picsum.photos/seed/${i}/300/300`, width: 300, height: 300 },
      { url: `https://picsum.photos/seed/${i}/64/64`, width: 64, height: 64 },
    ],
    release_date: '2023-01-01',
    album_type: 'album',
    external_urls: { spotify: '' },
  },
  duration_ms: 180000,
  preview_url: `https://p.scdn.co/mp3-preview/fake${i}`,
  uri: `spotify:track:track${i}`,
  explicit: false,
  popularity: 80,
  track_number: i,
  is_local: false,
  external_urls: { spotify: '' },
});

const MOCK_PLAYLISTS = Array.from({ length: 5 }, (_, i) => ({
  id: `playlist${i}`,
  name: `Party Playlist ${i + 1}`,
  description: '',
  images: [{ url: `https://picsum.photos/seed/pl${i}/300/300`, width: 300, height: 300 }],
  owner: { id: 'testuser', display_name: 'Test User', external_urls: { spotify: '' } },
  items: { total: 20 + i * 5, href: `https://api.spotify.com/v1/playlists/playlist${i}/items` },
  tracks: { total: 20 + i * 5, href: `https://api.spotify.com/v1/playlists/playlist${i}/items` },
  public: true,
  collaborative: false,
  external_urls: { spotify: '' },
  snapshot_id: `snap${i}`,
}));

const MOCK_PLAYLIST_TRACKS = {
  href: 'https://api.spotify.com/v1/playlists/playlist0/items',
  items: Array.from({ length: 20 }, (_, i) => ({
    added_at: '2023-01-01T00:00:00Z',
    added_by: { id: 'testuser', external_urls: { spotify: '' } },
    is_local: false,
    item: MOCK_TRACK(i + 1),
  })),
  limit: 100,
  next: null,
  offset: 0,
  previous: null,
  total: 20,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function injectAuth(page: Page) {
  await page.addInitScript(
    ({ token, expiry, userId }) => {
      localStorage.setItem('spotify_access_token', token);
      localStorage.setItem('spotify_token_expiry', expiry);
      // Inject Zustand store state so PlaylistPicker can filter by userId
      (window as Record<string, unknown>).__INJECT_SPOTIFY_PROFILE__ = {
        userId,
        displayName: 'Test User',
        isPremium: true,
      };
    },
    { token: MOCK_TOKEN, expiry: MOCK_EXPIRY, userId: 'testuser' },
  );
}

async function mockSpotifyAPIs(page: Page) {
  // User profile
  await page.route('https://api.spotify.com/v1/me', (route) => {
    route.fulfill({ json: MOCK_PROFILE });
  });

  // User playlists
  await page.route('https://api.spotify.com/v1/me/playlists*', (route) => {
    route.fulfill({
      json: {
        items: MOCK_PLAYLISTS,
        limit: 50,
        next: null,
        offset: 0,
        previous: null,
        total: MOCK_PLAYLISTS.length,
      },
    });
  });

  // Playlist tracks/items (any playlist id) — support both endpoints
  await page.route('https://api.spotify.com/v1/playlists/*/items*', (route) => {
    route.fulfill({ json: MOCK_PLAYLIST_TRACKS });
  });
  await page.route('https://api.spotify.com/v1/playlists/*/tracks*', (route) => {
    route.fulfill({ json: MOCK_PLAYLIST_TRACKS });
  });

  // Audio features
  await page.route('https://api.spotify.com/v1/audio-features*', (route) => {
    route.fulfill({
      json: {
        audio_features: Array.from({ length: 20 }, (_, i) => ({
          id: `track${i + 1}`,
          energy: 0.7 + Math.random() * 0.3,
          tempo: 120,
          danceability: 0.7,
          valence: 0.6,
          loudness: -6,
          speechiness: 0.04,
          acousticness: 0.1,
          instrumentalness: 0,
          liveness: 0.1,
          key: 5,
          mode: 1,
          time_signature: 4,
          duration_ms: 180000,
          analysis_url: '',
          track_href: '',
          uri: `spotify:track:track${i + 1}`,
          type: 'audio_features',
        })),
      },
    });
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Power Hour App', () => {
  test('login screen renders correctly', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/login');
    await expect(page.getByText('Power Hour')).toBeVisible();
    await expect(page.getByText('Connect with Spotify')).toBeVisible();
    console.log('✅ Login screen renders');
  });

  test('redirect to login when not authenticated', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/select');
    await expect(page).toHaveURL(/\/login/);
    console.log('✅ Auth guard works');
  });

  test('playlist picker loads and shows playlists', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      else consoleLogs.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

    await injectAuth(page);
    await mockSpotifyAPIs(page);
    await page.goto('http://127.0.0.1:5173/select');

    // Wait for playlists to load
    await page.waitForTimeout(2000);

    // Log what we see
    const bodyText = await page.textContent('body');
    console.log('BODY PREVIEW:', bodyText?.substring(0, 500));
    console.log('CONSOLE ERRORS:', consoleErrors);
    console.log('URL:', page.url());

    // Check for playlists
    const playlistCards = page.locator('button').filter({ hasText: 'Party Playlist' });
    const count = await playlistCards.count();
    console.log(`PLAYLIST CARDS FOUND: ${count}`);

    // Check track counts displayed
    const trackCounts = await page.locator('text=/\\d+ tracks?/').allTextContents();
    console.log('TRACK COUNTS SHOWN:', trackCounts);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/playlist-picker.png', fullPage: true });
    console.log('Screenshot saved to tests/screenshots/playlist-picker.png');

    expect(count).toBeGreaterThan(0);
  });

  test('playlist card click navigates to settings', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await injectAuth(page);
    await mockSpotifyAPIs(page);
    await page.goto('http://127.0.0.1:5173/select');

    await page.waitForTimeout(2000);

    // Find first real playlist card (not Quick Mix)
    const playlistCard = page.locator('button').filter({ hasText: 'Party Playlist 1' }).first();
    const isVisible = await playlistCard.isVisible();
    console.log('PLAYLIST CARD VISIBLE:', isVisible);

    if (isVisible) {
      const isDisabled = await playlistCard.isDisabled();
      console.log('PLAYLIST CARD DISABLED:', isDisabled);

      await playlistCard.click();
      await page.waitForTimeout(2000);
      console.log('URL AFTER CLICK:', page.url());
      console.log('ERRORS AFTER CLICK:', consoleErrors);

      await page.screenshot({ path: 'tests/screenshots/after-click.png', fullPage: true });
    }

    expect(page.url()).toContain('/settings');
  });

  test('game settings screen renders', async ({ page }) => {
    await injectAuth(page);
    await mockSpotifyAPIs(page);

    // Navigate directly to settings with tracks pre-loaded in store
    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);

    const playlistCard = page.locator('button').filter({ hasText: 'Party Playlist 1' }).first();
    if (await playlistCard.isVisible()) {
      await playlistCard.click();
      await page.waitForURL('**/settings', { timeout: 5000 }).catch(() => {});
    }

    console.log('URL:', page.url());
    await page.screenshot({ path: 'tests/screenshots/settings.png', fullPage: true });
  });

  test('full flow: login → select → settings → play', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

    await injectAuth(page);
    await mockSpotifyAPIs(page);

    // Mock audio to prevent actual audio loading
    await page.addInitScript(() => {
      const noop = () => {};
      const noopNode = () => ({ gain: { value: 1, setValueAtTime: noop, linearRampToValueAtTime: noop }, connect: noop, disconnect: noop });
      window.AudioContext = class MockAudioContext {
        currentTime = 0;
        state = 'running';
        createGain() { return noopNode(); }
        createAnalyser() { return { fftSize: 256, frequencyBinCount: 128, getByteFrequencyData: noop, connect: noop, disconnect: noop }; }
        createBufferSource() { return { buffer: null, connect: noop, disconnect: noop, start: noop, stop: noop, onended: null }; }
        decodeAudioData() { return Promise.resolve({}); }
        resume() { return Promise.resolve(); }
        close() { return Promise.resolve(); }
      } as any;
    });

    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);

    // Click first playlist
    const card = page.locator('button').filter({ hasText: 'Party Playlist 1' }).first();
    await card.click();
    await page.waitForTimeout(2000);
    console.log('AFTER PLAYLIST CLICK:', page.url());
    await page.screenshot({ path: 'tests/screenshots/flow-settings.png', fullPage: true });

    if (page.url().includes('/settings')) {
      // Click Start
      const startBtn = page.locator('button').filter({ hasText: /Start Power Hour/i }).first();
      if (await startBtn.isVisible()) {
        await startBtn.click();
        await page.waitForTimeout(3000);
        console.log('AFTER START:', page.url());
        await page.screenshot({ path: 'tests/screenshots/flow-play.png', fullPage: true });
      }
    }

    if (consoleErrors.length > 0) {
      console.log('ALL ERRORS:', consoleErrors);
    }
  });
});
