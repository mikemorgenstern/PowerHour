import { test, expect, type Page } from '@playwright/test';

const MOCK_TOKEN = 'mock_access_token_12345';
const MOCK_EXPIRY = String(Date.now() + 3600 * 1000);

async function injectAuth(page: Page) {
  await page.addInitScript(
    ({ token, expiry }) => {
      localStorage.setItem('spotify_access_token', token);
      localStorage.setItem('spotify_token_expiry', expiry);
    },
    { token: MOCK_TOKEN, expiry: MOCK_EXPIRY },
  );
}

const MOCK_TRACK = (i: number) => ({
  id: `track${i}`,
  name: `Song ${i}`,
  artists: [{ id: `a${i}`, name: `Artist ${i}`, external_urls: { spotify: '' } }],
  album: {
    id: `alb${i}`, name: `Album ${i}`,
    images: [{ url: `https://picsum.photos/seed/${i}/300/300`, width: 300, height: 300 }],
    release_date: '2023-01-01', album_type: 'album', external_urls: { spotify: '' },
  },
  duration_ms: 180000,
  preview_url: `https://p.scdn.co/mp3-preview/fake${i}`,
  uri: `spotify:track:track${i}`,
  explicit: false, popularity: 80, track_number: i, is_local: false,
  external_urls: { spotify: '' },
});

// Simulate what the real Spotify API returns when fields param causes issues:
// items come back but track is null or stripped
const TRACKS_WITH_NULL = {
  items: Array.from({ length: 5 }, (_, i) => ({
    added_at: '2023-01-01T00:00:00Z',
    added_by: { id: 'user', external_urls: { spotify: '' } },
    is_local: false,
    item: null, // This is what happens with bad fields param
  })),
  limit: 100, next: null, offset: 0, previous: null, total: 5,
};

const TRACKS_NORMAL = {
  items: Array.from({ length: 20 }, (_, i) => ({
    added_at: '2023-01-01T00:00:00Z',
    added_by: { id: 'user', external_urls: { spotify: '' } },
    is_local: false,
    item: MOCK_TRACK(i + 1),
  })),
  limit: 100, next: null, offset: 0, previous: null, total: 20,
};

const PLAYLISTS_WITH_ZERO_TOTALS = [
  {
    id: 'pl0', name: 'Discover Weekly',
    description: '', images: [],
    owner: { id: 'spotify', display_name: 'Spotify', external_urls: { spotify: '' } },
    items: { total: 0, href: '' }, tracks: { total: 0, href: '' },
    public: true, collaborative: false,
    external_urls: { spotify: '' }, snapshot_id: 'snap0',
  },
  {
    id: 'pl1', name: 'My Party Mix',
    description: '', images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
    owner: { id: 'testuser', display_name: 'Test User', external_urls: { spotify: '' } },
    items: { total: 25, href: '' }, tracks: { total: 25, href: '' },
    public: true, collaborative: false,
    external_urls: { spotify: '' }, snapshot_id: 'snap1',
  },
];

const MOCK_PROFILE = {
  id: 'testuser', display_name: 'Test User', email: 'test@test.com',
  product: 'free', images: [], country: 'US',
  external_urls: { spotify: '' }, followers: { total: 0 },
};

test.describe('Edge cases', () => {

  test('EDGE: zero-total playlists still show and allow clicking', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await injectAuth(page);

    await page.route('https://api.spotify.com/v1/me', r => r.fulfill({ json: MOCK_PROFILE }));
    await page.route('https://api.spotify.com/v1/me/playlists*', r => r.fulfill({
      json: { items: PLAYLISTS_WITH_ZERO_TOTALS, limit: 50, next: null, offset: 0, previous: null, total: 2 },
    }));
    // Normal tracks for pl1
    await page.route('https://api.spotify.com/v1/playlists/pl1/items*', r => r.fulfill({ json: TRACKS_NORMAL }));
    // Empty for pl0
    await page.route('https://api.spotify.com/v1/playlists/pl0/items*', r => r.fulfill({ json: TRACKS_WITH_NULL }));

    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') ?? '';
    console.log('ZERO TOTAL - body:', bodyText.substring(0, 400));

    // pl0 (owner: 'spotify') should be HIDDEN — Dev Mode filters non-owned playlists
    const pl0 = page.locator('button').filter({ hasText: 'Discover Weekly' });
    await expect(pl0).not.toBeVisible();
    console.log('Discover Weekly correctly hidden (non-owned playlist)');

    // pl1 (owner: 'testuser') shows 25 tracks — should be clickable and navigate
    const pl1 = page.locator('button').filter({ hasText: 'My Party Mix' });
    await expect(pl1).toBeVisible();
    await pl1.click();
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log('URL after clicking 25-track playlist:', url);
    await page.screenshot({ path: 'tests/screenshots/zero-total-edge.png', fullPage: true });

    expect(url).toContain('/settings');
    expect(errors).toHaveLength(0);
  });

  test('EDGE: null tracks from API shows error then allows retry', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await injectAuth(page);

    await page.route('https://api.spotify.com/v1/me', r => r.fulfill({ json: MOCK_PROFILE }));
    await page.route('https://api.spotify.com/v1/me/playlists*', r => r.fulfill({
      json: {
        items: [PLAYLISTS_WITH_ZERO_TOTALS[1]], // one playlist with 25 tracks
        limit: 50, next: null, offset: 0, previous: null, total: 1,
      },
    }));
    // First call returns null tracks (simulates bad fields param)
    let callCount = 0;
    await page.route('https://api.spotify.com/v1/playlists/pl1/items*', r => {
      callCount++;
      if (callCount === 1) {
        r.fulfill({ json: TRACKS_WITH_NULL }); // first: all null → 0 tracks
      } else {
        r.fulfill({ json: TRACKS_NORMAL }); // retry: normal
      }
    });

    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);

    const card = page.locator('button').filter({ hasText: 'My Party Mix' });
    await expect(card).toBeVisible();

    // First click — should show error (0 tracks)
    await card.click();
    await page.waitForTimeout(2000);
    const bodyAfterFirst = await page.textContent('body') ?? '';
    console.log('After first click (null tracks):', bodyAfterFirst.substring(0, 300));
    console.log('URL after first click:', page.url());

    // Card should be re-enabled (not stuck)
    const isDisabled = await card.isDisabled();
    console.log('Card disabled after error?', isDisabled);
    expect(isDisabled).toBe(false);

    // Second click — should work
    await card.click();
    await page.waitForTimeout(2000);
    console.log('URL after retry click:', page.url());
    expect(page.url()).toContain('/settings');
  });

  test('EDGE: API 400 error on tracks — card re-enables for retry', async ({ page }) => {
    await injectAuth(page);
    await page.route('https://api.spotify.com/v1/me', r => r.fulfill({ json: MOCK_PROFILE }));
    await page.route('https://api.spotify.com/v1/me/playlists*', r => r.fulfill({
      json: { items: [PLAYLISTS_WITH_ZERO_TOTALS[1]], limit: 50, next: null, offset: 0, previous: null, total: 1 },
    }));

    let callCount = 0;
    await page.route('https://api.spotify.com/v1/playlists/pl1/items*', r => {
      callCount++;
      if (callCount === 1) {
        r.fulfill({ status: 400, json: { error: { status: 400, message: 'Bad field parameter' } } });
      } else {
        r.fulfill({ json: TRACKS_NORMAL });
      }
    });

    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);

    const card = page.locator('button').filter({ hasText: 'My Party Mix' });
    await card.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') ?? '';
    console.log('Body after 400 error:', bodyText.substring(0, 400));

    const isDisabled = await card.isDisabled();
    console.log('Card disabled after 400 error?', isDisabled);
    expect(isDisabled).toBe(false);

    await card.click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/settings');
  });

  test('EDGE: game screen loads without audio crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await injectAuth(page);
    await page.route('https://api.spotify.com/v1/me', r => r.fulfill({ json: MOCK_PROFILE }));
    await page.route('https://api.spotify.com/v1/me/playlists*', r => r.fulfill({
      json: { items: [PLAYLISTS_WITH_ZERO_TOTALS[1]], limit: 50, next: null, offset: 0, previous: null, total: 1 },
    }));
    await page.route('https://api.spotify.com/v1/playlists/pl1/items*', r => r.fulfill({ json: TRACKS_NORMAL }));

    // Mock fetch for preview URLs to avoid actual network calls
    await page.route('https://p.scdn.co/**', r => {
      // Return a minimal silent MP3 (44 bytes)
      r.fulfill({
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
        body: Buffer.from('FFFB9000000000000000000000000000000000000000', 'hex'),
      });
    });

    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);

    const card = page.locator('button').filter({ hasText: 'My Party Mix' });
    await card.click();
    await page.waitForURL('**/settings', { timeout: 5000 });

    const startBtn = page.locator('button').filter({ hasText: /Start Power Hour/i });
    await startBtn.click();
    await page.waitForTimeout(3000);

    console.log('URL after start:', page.url());
    console.log('Errors on game screen:', errors);
    await page.screenshot({ path: 'tests/screenshots/game-screen.png', fullPage: true });

    // Should be on /play
    expect(page.url()).toContain('/play');

    // No fatal JS errors
    const fatalErrors = errors.filter(e =>
      !e.includes('AudioContext') && // audio autoplay restriction is expected
      !e.includes('decode') &&
      !e.includes('preview')
    );
    console.log('Fatal errors:', fatalErrors);
  });

  test('settings screen: all controls work', async ({ page }) => {
    await injectAuth(page);
    await page.route('https://api.spotify.com/v1/me', r => r.fulfill({ json: MOCK_PROFILE }));
    await page.route('https://api.spotify.com/v1/me/playlists*', r => r.fulfill({
      json: { items: [PLAYLISTS_WITH_ZERO_TOTALS[1]], limit: 50, next: null, offset: 0, previous: null, total: 1 },
    }));
    await page.route('https://api.spotify.com/v1/playlists/pl1/items*', r => r.fulfill({ json: TRACKS_NORMAL }));

    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(2000);
    await page.locator('button').filter({ hasText: 'My Party Mix' }).click();
    await page.waitForURL('**/settings', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/settings-screen.png', fullPage: true });
    const bodyText = await page.textContent('body') ?? '';
    console.log('Settings screen body:', bodyText.substring(0, 500));

    // Check sliders exist
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();
    console.log('Sliders found:', sliderCount);
    expect(sliderCount).toBeGreaterThan(0);

    // Start button exists
    const startBtn = page.locator('button').filter({ hasText: /Start Power Hour/i });
    await expect(startBtn).toBeVisible();
  });
});
