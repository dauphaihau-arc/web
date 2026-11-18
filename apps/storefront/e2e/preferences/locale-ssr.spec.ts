import {
  expect,
  test,
  type APIRequestContext,
} from '@playwright/test';
import { LocalStorageKeys } from '@arc/enums/local-storage-keys';

/**
 * SSR-only coverage for locale rendering and the locale the storefront sends
 * to the API.
 *
 * Runs against the real Node server plus the deterministic backend fixture
 * (`../support/ssr-fixture-server.mjs`), which records the market headers of
 * every request. The static preview build cannot prove either the server-emitted
 * `html[lang]` or the server-side `X-Locale` header, so this file is gated to
 * `E2E_MODE=ssr` and the static suite skips it.
 */

const FIXTURE_ORIGIN = `http://127.0.0.1:${process.env.E2E_FIXTURE_PORT ?? 4310}`;

type FixtureRequest = {
  method: string
  path: string
  search: string
  unexpected: boolean
  headers?: Record<string, string>
};

async function resetFixture(request: APIRequestContext) {
  const response = await request.post(`${FIXTURE_ORIGIN}/__fixture/reset`);
  expect(response.ok()).toBe(true);
}

async function fixtureRequests(request: APIRequestContext): Promise<FixtureRequest[]> {
  const response = await request.get(`${FIXTURE_ORIGIN}/__fixture/requests`);
  expect(response.ok()).toBe(true);
  return (await response.json()).requests as FixtureRequest[];
}

test.describe('locale on the server and in API request headers', () => {
  test.skip(process.env.E2E_MODE !== 'ssr', 'SSR only');

  test.beforeEach(async ({ request }) => {
    await resetFixture(request);
  });

  test('the Vietnamese URL renders html lang="vi" and requests the API in vi-*', async ({ page, request }) => {
    const response = await page.goto('/vi');
    expect(response?.status()).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');

    const requests = await fixtureRequests(request);
    expect(
      requests.filter(entry => (entry.headers?.['x-locale'] ?? '').startsWith('vi-')),
    ).not.toHaveLength(0);
  });

  test('the unprefixed root renders html lang="en" and requests the API in en-*', async ({ page, request }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const requests = await fixtureRequests(request);
    expect(
      requests.filter(entry => (entry.headers?.['x-locale'] ?? '').startsWith('en-')),
    ).not.toHaveLength(0);
  });

  test('a stored Vietnamese preference redirects the bare root to /vi', async ({ page, context }) => {
    await context.addCookies([{
      name: LocalStorageKeys.GUEST_PREFERENCES,
      value: JSON.stringify({
        region: 'United States',
        language: 'vi',
        currency: 'USD',
      }),
      domain: '127.0.0.1',
      path: '/',
    }]);

    await page.goto('/');

    await expect(page).toHaveURL(/\/vi$/);
  });

  test('a Vietnamese category page renders translated catalog copy', async ({ page }) => {
    await page.goto('/vi/c/gaming-laptops-c1');

    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.getByText(/Sắp xếp theo:/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Đặt lại bộ lọc' })).toBeVisible();

    // The category resolver returns a language-neutral canonical path, so the
    // page must add the URL locale instead of canonicalizing to `/c/...`.
    const origin = new URL(page.url()).origin;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      '/vi/c/gaming-laptops-c1',
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `${origin}/c/gaming-laptops-c1`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="vi"]')).toHaveAttribute(
      'href',
      `${origin}/vi/c/gaming-laptops-c1`,
    );
  });

  for (const localeCase of [
    {
      label: 'English',
      locale: 'en',
      path: '/',
      canonicalPath: '/',
      enPath: '/',
      viPath: '/vi',
      title: /Discover products from independent sellers/,
    },
    {
      label: 'Vietnamese',
      locale: 'vi',
      path: '/vi',
      canonicalPath: '/vi',
      enPath: '/',
      viPath: '/vi',
      title: /Khám phá sản phẩm từ những người bán độc lập/,
    },
  ]) {
    test(`${localeCase.label} root emits a translated title, self-canonical, and reciprocal alternates`, async ({ page }) => {
      const response = await page.goto(localeCase.path);
      expect(response?.status()).toBe(200);

      const origin = new URL(page.url()).origin;

      await expect(page.locator('html')).toHaveAttribute('lang', localeCase.locale);
      await expect(page).toHaveTitle(localeCase.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Arc Storefront/);

      // The canonical stays on the locale the buyer requested: `/vi` must never
      // canonicalize to the unprefixed English URL.
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        localeCase.canonicalPath,
      );

      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href',
        `${origin}${localeCase.enPath}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="vi"]')).toHaveAttribute(
        'href',
        `${origin}${localeCase.viPath}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        'href',
        `${origin}${localeCase.enPath}`,
      );
    });
  }
});
