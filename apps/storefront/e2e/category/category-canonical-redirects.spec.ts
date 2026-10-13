import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';

/**
 * SSR browser regression for category URL canonicalization (ticket 06).
 *
 * Runs only in SSR mode (`pnpm e2e:ssr`): Playwright launches the real storefront
 * server (`.output/server/index.mjs`) plus the deterministic backend fixture in
 * `../support/ssr-fixtures.mjs`.
 *
 * Every redirect is asserted at the HTTP layer with auto-follow disabled, so the
 * test proves the actual status (301, not 308) and `Location` after one hop; the
 * destination is then fetched again to prove it succeeds without another
 * redirect. Client-side canonicalization is exercised through a real SPA route
 * transition with a document-load counter proving no full reload happened.
 */

const FIXTURE_ORIGIN = `http://127.0.0.1:${process.env.E2E_FIXTURE_PORT ?? 4310}`;

declare global {
  interface Window {
    __categoryNavMarker?: string
  }
}

async function resetFixture(request: APIRequestContext) {
  const response = await request.post(`${FIXTURE_ORIGIN}/__fixture/reset`);
  expect(response.ok()).toBe(true);
}

function locationPath(response: APIResponse): string {
  const location = response.headers().location;
  expect(location, 'redirect response carries a Location header').toBeTruthy();
  return decodeURIComponent(new URL(location!, 'http://127.0.0.1').pathname);
}

async function expectRedirect(
  request: APIRequestContext,
  from: string,
  to: string,
) {
  const response = await request.get(from, { maxRedirects: 0 });

  expect(response.status(), `${from} must be a permanent 301`).toBe(301);
  expect(locationPath(response)).toBe(to);

  // The destination must succeed on its own with no further redirect.
  const destination = await request.get(response.headers().location!, { maxRedirects: 0 });
  expect(destination.status(), `${to} must succeed directly`).toBe(200);
  expect(destination.headers().location).toBeUndefined();
}

async function expectNotFound(request: APIRequestContext, path: string) {
  const response = await request.get(path, { maxRedirects: 0 });

  expect(response.status(), `${path} must be a genuine 404`).toBe(404);
  expect(response.headers().location, `${path} must not redirect to a parent`).toBeUndefined();
}

test.describe('category canonical redirects (SSR)', () => {
  test.beforeEach(async ({ request }) => {
    await resetFixture(request);
  });

  test('an incorrect slug receives a single HTTP 301 to the current canonical URL', async ({ request }) => {
    await expectRedirect(request, '/c/outdated-slug-c1', '/c/gaming-laptops-c1');
  });

  test('a trailing slash on a canonical URL is corrected in one hop', async ({ request }) => {
    await expectRedirect(request, '/c/gaming-laptops-c1/', '/c/gaming-laptops-c1');
  });

  test('a wrong slug and trailing slash are combined into one redirect that preserves the query', async ({ request }) => {
    await expectRedirect(
      request,
      '/c/outdated-slug-c1/?min_price=50&page=2',
      '/c/gaming-laptops-c1',
    );

    const response = await request.get('/c/outdated-slug-c1/?min_price=50&page=2', { maxRedirects: 0 });
    const location = response.headers().location ?? '';
    expect(new URL(location, 'http://127.0.0.1').search).toBe('?min_price=50&page=2');
  });

  test('a Unicode slug round-trips and a wrong slug canonicalizes to it', async ({ request }) => {
    // The canonical Unicode URL succeeds unchanged.
    const canonical = await request.get('/c/caf%C3%A9-cadeaux-c11', { maxRedirects: 0 });
    expect(canonical.status()).toBe(200);
    expect(canonical.headers().location).toBeUndefined();

    await expectRedirect(request, '/c/cafe-cadeaux-c11', '/c/caf\u00e9-cadeaux-c11');
  });

  test('duplicate slugs canonicalize by public identity, never by slug', async ({ request }) => {
    await expectRedirect(request, '/c/outdated-c3', '/c/gaming-mice-c3');
    await expectRedirect(request, '/c/outdated-c13', '/c/gaming-mice-c13');
  });

  test('a legacy hierarchical path redirects to the owner current canonical URL in one hop', async ({ request }) => {
    await expectRedirect(
      request,
      '/c/home/gaming-laptops?min_price=50',
      '/c/gaming-laptops-c1',
    );

    const response = await request.get('/c/home/gaming-laptops?min_price=50', { maxRedirects: 0 });
    expect(new URL(response.headers().location ?? '', 'http://127.0.0.1').search)
      .toBe('?min_price=50');

    // The legacy path owner is the category identity, so a URL that historically
    // belonged to the duplicate-slug EU category still lands on that identity.
    await expectRedirect(request, '/c/home/gaming-mice', '/c/gaming-mice-c3');
    await expectRedirect(request, '/c/legacy-gaming-mice', '/c/gaming-mice-c13');

    // A legacy path containing a Unicode segment canonicalizes too.
    await expectRedirect(request, '/c/home/caf%C3%A9-cadeaux', '/c/caf\u00e9-cadeaux-c11');
  });

  test('a canonical legacy destination renders products with no further redirect', async ({ page }) => {
    const response = await page.goto('/c/home/gaming-laptops');

    expect(response?.status()).toBe(200);
    expect(page.url()).toContain('/c/gaming-laptops-c1');
    await expect(page.getByText('Aurora Gaming Laptop', { exact: true })).toBeVisible({ timeout: 20_000 });

    // Canonical metadata uses the same URL policy as the redirect destination.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', '/c/gaming-laptops-c1');

    // Requesting the redirected-to URL directly issues no further redirect.
    const direct = await page.request.get('/c/gaming-laptops-c1', { maxRedirects: 0 });
    expect(direct.status()).toBe(200);
    expect(direct.headers().location).toBeUndefined();
  });

  test('malformed and unknown paths return 404 without redirecting to a parent', async ({ request }) => {
    await expectNotFound(request, '/c/gaming-laptops-c01');
    await expectNotFound(request, '/c/gaming-laptops-c9999');
    await expectNotFound(request, '/c/unknown-parent/unknown-child');
    await expectNotFound(request, '/c/home/unknown');
    await expectNotFound(request, '/c/');
  });

  test('a legacy path backend failure stays an error, not a fabricated 404', async ({ request }) => {
    const response = await request.get('/c/broken/legacy', { maxRedirects: 0 });

    expect(response.status()).toBeGreaterThanOrEqual(500);
    expect(response.headers().location).toBeUndefined();
  });

  test('client navigation replaces the route in place, preserving the query', async ({ page }) => {
    let documentLoads = 0;
    page.on('load', () => {
      documentLoads += 1;
    });

    await page.goto('/c/gaming-laptops-c1');
    await expect(page.getByText('Aurora Gaming Laptop', { exact: true })).toBeVisible({ timeout: 20_000 });

    // A real SPA transition into the non-canonical URL (an in-app stale link or
    // restored history entry), not a document load.
    await page.evaluate(() => {
      window.__categoryNavMarker = 'kept';
      window.history.pushState({}, '', '/c/outdated-slug-c1?min_price=50');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page).toHaveURL((url) => {
      const current = new URL(url);
      return current.pathname === '/c/gaming-laptops-c1'
        && current.searchParams.get('min_price') === '50';
    });
    await expect(page.getByText('Aurora Gaming Laptop', { exact: true })).toBeVisible({ timeout: 20_000 });

    // The route was replaced in place: the document never reloaded.
    expect(await page.evaluate(() => window.__categoryNavMarker)).toBe('kept');
    expect(documentLoads).toBe(1);
  });

  test('client navigation into a legacy path replaces the route with the canonical URL', async ({ page }) => {
    await page.goto('/c/gaming-laptops-c1');
    await expect(page.getByText('Aurora Gaming Laptop', { exact: true })).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => {
      window.history.pushState({}, '', '/c/home/gaming-mice');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page).toHaveURL(/\/c\/gaming-mice-c3$/);
    await expect(page.getByText('Precision Gaming Mouse', { exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
