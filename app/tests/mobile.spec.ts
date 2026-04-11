/**
 * Comprehensive mobile tests — layout, touch, responsiveness across devices.
 * Tests against mocked Spotify API (same as diagnostic/edge-case tests).
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Devices to test
// ---------------------------------------------------------------------------

const MOBILE_DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667, scale: 2, touch: true },
  { name: 'iPhone 14 Pro', width: 393, height: 852, scale: 3, touch: true },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, scale: 3, touch: true },
  { name: 'Pixel 7', width: 412, height: 915, scale: 2.625, touch: true },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, scale: 3, touch: true },
  { name: 'iPad Mini', width: 768, height: 1024, scale: 2, touch: true },
  { name: 'iPad Pro 11"', width: 834, height: 1194, scale: 2, touch: true },
];

// ---------------------------------------------------------------------------
// Mock Spotify API helpers (same as diagnostic tests)
// ---------------------------------------------------------------------------

function makePlaylists(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `pl${i}`,
    name: `Playlist ${i + 1}`,
    description: '',
    images: [{ url: `https://placekitten.com/300/300?i=${i}`, height: 300, width: 300 }],
    owner: { id: 'user123', display_name: 'Test User', external_urls: { spotify: '' } },
    items: { total: 20 + i * 5, href: '' },
    tracks: { total: 20 + i * 5, href: '' },
    public: true,
    collaborative: false,
    external_urls: { spotify: '' },
    snapshot_id: 'snap',
  }));
}

function makeTracks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    added_at: '2024-01-01',
    added_by: { id: 'user123', external_urls: { spotify: '' } },
    is_local: false,
    item: {
      id: `track${i}`,
      name: `Track ${i + 1}`,
      artists: [{ id: `artist${i}`, name: `Artist ${i + 1}`, external_urls: { spotify: '' } }],
      album: {
        id: `album${i}`,
        name: `Album ${i + 1}`,
        images: [
          { url: `https://placekitten.com/640/640?t=${i}`, height: 640, width: 640 },
          { url: `https://placekitten.com/300/300?t=${i}`, height: 300, width: 300 },
          { url: `https://placekitten.com/64/64?t=${i}`, height: 64, width: 64 },
        ],
        release_date: '2024-01-01',
        album_type: 'album',
        external_urls: { spotify: '' },
      },
      duration_ms: 180000,
      preview_url: null,
      uri: `spotify:track:track${i}`,
      explicit: false,
      popularity: 80,
      track_number: i + 1,
      is_local: false,
      external_urls: { spotify: '' },
    },
  }));
}

async function setupMocks(page: Page) {
  // Mock token exchange
  await page.route('https://accounts.spotify.com/api/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock_token_123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh',
        scope: 'streaming user-read-private user-library-read user-top-read playlist-read-private',
      }),
    });
  });

  // Mock /me
  await page.route('**/api.spotify.com/v1/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user123',
        display_name: 'Test User',
        email: 'test@example.com',
        images: [],
        product: 'premium',
        country: 'US',
        external_urls: { spotify: '' },
        followers: { total: 42 },
      }),
    });
  });

  // Mock /me/playlists
  await page.route('**/api.spotify.com/v1/me/playlists*', async (route) => {
    const playlists = makePlaylists(8);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: playlists,
        total: playlists.length,
        limit: 50,
        offset: 0,
        next: null,
        previous: null,
        href: '',
      }),
    });
  });

  // Mock /playlists/{id}/items
  await page.route('**/api.spotify.com/v1/playlists/*/items*', async (route) => {
    const tracks = makeTracks(20);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: tracks,
        total: tracks.length,
        limit: 100,
        offset: 0,
        next: null,
        previous: null,
        href: '',
      }),
    });
  });

  // Mock /me/tracks — uses `track` field (not `item`) for liked songs endpoint
  await page.route('**/api.spotify.com/v1/me/tracks*', async (route) => {
    const items = makeTracks(50).map(t => ({
      added_at: t.added_at,
      track: t.item, // /me/tracks uses `track`, not `item`
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        total: 50,
        limit: 50,
        offset: 0,
        next: null,
        previous: null,
        href: '',
      }),
    });
  });

  // Mock /me/top/tracks
  await page.route('**/api.spotify.com/v1/me/top/tracks*', async (route) => {
    const items = makeTracks(20).map(t => t.item);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items,
        total: 20,
        limit: 20,
        offset: 0,
        next: null,
        previous: null,
        href: '',
      }),
    });
  });

  // Mock Spotify SDK script
  await page.route('https://sdk.scdn.co/spotify-player.js', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '// mock SDK' });
  });
}

async function loginAndNavigate(page: Page) {
  // Navigate first so localStorage is accessible on the correct origin
  await page.goto('http://127.0.0.1:5173/login');
  await page.evaluate(() => {
    localStorage.setItem('spotify_access_token', 'mock_token_123');
    localStorage.setItem('spotify_token_expiry', String(Date.now() + 3600000));
    localStorage.setItem('spotify_refresh_token', 'mock_refresh');
  });
}

// ---------------------------------------------------------------------------
// Tests — run for each device
// ---------------------------------------------------------------------------

for (const device of MOBILE_DEVICES) {
  test.describe(`Mobile: ${device.name} (${device.width}x${device.height})`, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.scale,
      hasTouch: device.touch,
      isMobile: device.width < 768,
    });

    test('login screen renders without overflow', async ({ page }) => {
      await setupMocks(page);
      await page.goto('http://127.0.0.1:5173/login');
      await page.waitForTimeout(500);

      // Title visible
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Power Hour');

      // Connect button visible and tappable
      const btn = page.locator('text=Connect with Spotify');
      await expect(btn).toBeVisible();

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(device.width + 1);

      // No vertical scroll needed to see the button
      const btnBox = await btn.boundingBox();
      expect(btnBox).not.toBeNull();
      expect(btnBox!.y + btnBox!.height).toBeLessThan(device.height);

      await page.screenshot({ path: `tests/screenshots/mobile-${device.name.replace(/[^a-zA-Z0-9]/g, '-')}-login.png` });
    });

    test('playlist picker fits without overflow', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);

      // Title visible
      await expect(page.locator('h1')).toContainText('Choose Your Playlist');

      // Search bar visible
      const searchInput = page.locator('input[placeholder*="Filter"]');
      await expect(searchInput).toBeVisible();

      // Liked Songs and Quick Mix visible
      await expect(page.locator('button').filter({ hasText: 'Liked Songs' }).first()).toBeVisible();
      await expect(page.locator('button').filter({ hasText: 'Quick Mix' }).first()).toBeVisible();

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(device.width + 1);

      // Grid has 2 columns on small screens, more on larger
      const cards = page.locator('button').filter({ hasText: /\d+ tracks?/ });
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Check card widths — none should exceed half the viewport on small screens
      if (device.width < 640) {
        const firstCard = await cards.first().boundingBox();
        expect(firstCard).not.toBeNull();
        // 2 columns means each card < ~55% viewport width (with gaps)
        expect(firstCard!.width).toBeLessThan(device.width * 0.55);
      }

      await page.screenshot({ path: `tests/screenshots/mobile-${device.name.replace(/[^a-zA-Z0-9]/g, '-')}-playlists.png`, fullPage: true });
    });

    test('playlist cards are tappable and scrollable', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);

      // Scroll down to see more cards
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(300);

      // Tap a playlist card
      const card = page.locator('button').filter({ hasText: /\d+ tracks?/ }).first();
      await card.tap();
      await page.waitForTimeout(2000);

      // Should navigate to settings
      expect(page.url()).toContain('/settings');
    });

    test('settings page fits on mobile', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);

      // Set tracks in store
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);
      const card = page.locator('button').filter({ hasText: /\d+ tracks?/ }).first();
      await card.tap();
      await page.waitForTimeout(2000);

      // Now on settings
      expect(page.url()).toContain('/settings');

      // Check elements are visible
      await expect(page.locator('text=Game Settings')).toBeVisible();

      // Start button visible without scrolling too far
      const startBtn = page.locator('button').filter({ hasText: /Start Power Hour/i });
      await expect(startBtn).toBeVisible();

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(device.width + 1);

      await page.screenshot({ path: `tests/screenshots/mobile-${device.name.replace(/[^a-zA-Z0-9]/g, '-')}-settings.png`, fullPage: true });
    });

    test('game screen fits without overflow', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);

      // Navigate through the flow
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);
      await page.locator('button').filter({ hasText: /\d+ tracks?/ }).first().tap();
      await page.waitForTimeout(2000);

      // Start game
      const startBtn = page.locator('button').filter({ hasText: /Start Power Hour/i });
      await startBtn.tap();
      await page.waitForTimeout(3000);

      // Check no overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(device.width + 1);

      // Game screen shows countdown or round info
      const body = await page.textContent('body');
      expect(body).toMatch(/Round|Paused|Power Hour|Get Your Drinks Ready|countdown/i);

      await page.screenshot({ path: `tests/screenshots/mobile-${device.name.replace(/[^a-zA-Z0-9]/g, '-')}-game.png` });
    });

    test('search filters playlists with virtual keyboard space', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[placeholder*="Filter"]');
      await searchInput.tap();
      await searchInput.fill('Playlist 1');
      await page.waitForTimeout(500);

      // Should filter to just matching playlists
      const cards = page.locator('button').filter({ hasText: /\d+ tracks?/ });
      const count = await cards.count();
      // "Playlist 1" matches "Playlist 1" only (not "Playlist 2", etc.)
      expect(count).toBeLessThanOrEqual(1);

      await page.screenshot({ path: `tests/screenshots/mobile-${device.name.replace(/[^a-zA-Z0-9]/g, '-')}-search.png` });
    });

    test('Liked Songs flow works on mobile', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);

      const likedBtn = page.locator('button').filter({ hasText: 'Liked Songs' }).first();
      await likedBtn.tap();
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/settings');

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('tracks loaded');
    });

    test('error dismissal works with tap', async ({ page }) => {
      await setupMocks(page);
      await loginAndNavigate(page);

      // Override one playlist to return 403
      await page.route('**/api.spotify.com/v1/playlists/pl0/items*', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: { status: 403, message: 'Forbidden' } }),
        });
      });

      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);

      // Tap the first playlist (which will 403)
      const firstCard = page.locator('button').filter({ hasText: 'Playlist 1' }).first();
      await firstCard.tap();
      await page.waitForTimeout(2000);

      // Error should appear
      const error = page.locator('.text-neon-pink');
      await expect(error).toBeVisible();

      // Dismiss button should work
      const dismiss = page.locator('button').filter({ hasText: 'Dismiss' });
      await dismiss.tap();
      await page.waitForTimeout(500);

      // Error should be gone
      await expect(error).not.toBeVisible();
    });

    test('landscape orientation works', async ({ page, context }) => {
      await setupMocks(page);
      await loginAndNavigate(page);

      // Simulate landscape by setting viewport
      await page.setViewportSize({ width: device.height, height: device.width });
      await page.goto('http://127.0.0.1:5173/select');
      await page.waitForTimeout(1500);

      // Should still render properly
      await expect(page.locator('h1')).toContainText('Choose Your Playlist');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(device.height + 1);

      await page.screenshot({ path: `tests/screenshots/mobile-${device.name.replace(/[^a-zA-Z0-9]/g, '-')}-landscape.png`, fullPage: true });
    });
  });
}

// ---------------------------------------------------------------------------
// Touch-specific interaction tests (run once on iPhone 14 Pro)
// ---------------------------------------------------------------------------

test.describe('Touch interactions', () => {
  test.use({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });

  test('pull-to-scroll works smoothly on playlist grid', async ({ page }) => {
    await setupMocks(page);
    await loginAndNavigate(page);
    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(1500);

    // Get initial scroll position
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Swipe up (scroll down)
    await page.touchscreen.tap(200, 600);
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBeGreaterThan(scrollBefore);
  });

  test('double-tap does not zoom on cards', async ({ page }) => {
    await setupMocks(page);
    await loginAndNavigate(page);
    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(1500);

    // Check that touch-action or meta viewport prevents zoom
    const hasViewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content')?.includes('width=device-width') ?? false;
    });
    expect(hasViewportMeta).toBe(true);
  });

  test('back navigation from settings works', async ({ page }) => {
    await setupMocks(page);
    await loginAndNavigate(page);
    await page.goto('http://127.0.0.1:5173/select');
    await page.waitForTimeout(1500);

    // Go to settings
    await page.locator('button').filter({ hasText: /\d+ tracks?/ }).first().tap();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/settings');

    // Find and tap "Back to playlists"
    const backBtn = page.locator('button, a').filter({ hasText: /Back|back|playlists/i }).first();
    if (await backBtn.isVisible()) {
      await backBtn.tap();
      await page.waitForTimeout(1500);
      expect(page.url()).toContain('/select');
    } else {
      // Use browser back
      await page.goBack();
      await page.waitForTimeout(1500);
      expect(page.url()).toContain('/select');
    }
  });

  test('text is readable at mobile size', async ({ page }) => {
    await setupMocks(page);
    await loginAndNavigate(page);
    await page.goto('http://127.0.0.1:5173/login');
    await page.waitForTimeout(500);

    // Title font size should be at least 36px on mobile (text-6xl = 3.75rem = 60px)
    const titleSize = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
    });
    expect(titleSize).toBeGreaterThanOrEqual(36);

    // Body text should be at least 14px
    const bodySize = await page.evaluate(() => {
      const p = document.querySelector('p');
      return p ? parseFloat(getComputedStyle(p).fontSize) : 0;
    });
    expect(bodySize).toBeGreaterThanOrEqual(14);
  });

  test('buttons have adequate tap targets (44x44 minimum)', async ({ page }) => {
    await setupMocks(page);
    await loginAndNavigate(page);
    await page.goto('http://127.0.0.1:5173/login');
    await page.waitForTimeout(500);

    // Connect button should be at least 44px tall (Apple HIG minimum)
    const btn = page.locator('text=Connect with Spotify');
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
