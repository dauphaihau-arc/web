import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';

/**
 * Real-API category canonicalization journey.
 *
 * The storefront server runs against a real API over HTTP backed by a fresh,
 * migrated PostgreSQL database whose categories and legacy-path aliases were
 * persisted before the identity migration captured them (see
 * `apps/api/api/test/support/category-redirect-e2e-api.ts`). The API origin and
 * the seeded paths arrive through the environment from that harness.
 *
 * Every redirect is asserted with `maxRedirects: 0`, so the actual `301` status
 * and `Location` are observed; the destination is then fetched again to prove it
 * serves `200` without another redirect. A real browser navigation observes the
 * same hop, and an in-app SPA transition proves the route is replaced in place.
 */

type FixtureCategory = {
  name: string
  publicId: string
  slug: string
  legacyPath: string
  canonicalPath: string
};

function loadFixtures(): FixtureCategory[] {
  const raw = process.env.CATEGORY_E2E_FIXTURES_JSON;

  if (!raw) {
    throw new Error(
      'CATEGORY_E2E_FIXTURES_JSON is required: start the real API harness (apps/api/api/test/support/category-redirect-e2e-api.ts) and pass its reported fixtures.',
    );
  }

  const parsed = JSON.parse(raw) as FixtureCategory[];

  if (parsed.length === 0) {
    throw new Error('the real API harness reported no category fixtures');
  }

  return parsed;
}

const FIXTURES = loadFixtures();
const HOME = FIXTURES.find(fixture => fixture.name === 'Home')!;
const CHILD = FIXTURES.find(fixture => fixture.name === 'Caf\u00e9 Cadeaux')!;
const DUPLICATE_A = FIXTURES.find(fixture => fixture.name === 'Gaming Mice')!;
const DUPLICATE_B = FIXTURES.find(fixture => fixture.name === 'Gaming_Mice')!;

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

  const destination = await request.get(response.headers().location!, { maxRedirects: 0 });
  expect(destination.status(), `${to} must succeed directly`).toBe(200);
  expect(destination.headers().location).toBeUndefined();
}

async function expectNotFound(request: APIRequestContext, path: string) {
  const response = await request.get(path, { maxRedirects: 0 });

  expect(response.status(), `${path} must be a genuine 404`).toBe(404);
  expect(response.headers().location).toBeUndefined();
}

test.describe('real-API category canonical redirects', () => {
  test('each persisted legacy path is owned by its identity and 301s to the current canonical URL in one hop', async ({ request }) => {
    for (const fixture of FIXTURES) {
      await expectRedirect(request, fixture.legacyPath, fixture.canonicalPath);
    }
  });

  test('duplicate slugs stay distinct because the legacy path owner is the public identity', async ({ request }) => {
    expect(DUPLICATE_A.slug).toBe(DUPLICATE_B.slug);
    expect(DUPLICATE_A.canonicalPath).not.toBe(DUPLICATE_B.canonicalPath);

    await expectRedirect(request, DUPLICATE_A.legacyPath, DUPLICATE_A.canonicalPath);
    await expectRedirect(request, DUPLICATE_B.legacyPath, DUPLICATE_B.canonicalPath);
  });

  test('a syntactically valid wrong slug 301s to the current canonical URL', async ({ request }) => {
    await expectRedirect(request, `/c/outdated-slug-c${HOME.publicId}`, HOME.canonicalPath);
  });

  test('a query is preserved across the legacy-path redirect', async ({ request }) => {
    const response = await request.get(`${CHILD.legacyPath}?min_price=50`, { maxRedirects: 0 });

    expect(response.status()).toBe(301);
    expect(locationPath(response)).toBe(CHILD.canonicalPath);
    expect(new URL(response.headers().location!, 'http://127.0.0.1').search).toBe('?min_price=50');
  });

  test('unknown and malformed legacy paths return 404 without a parent fallback', async ({ request }) => {
    await expectNotFound(request, '/c/home/unknown');
    await expectNotFound(request, '/c/unknown-parent/unknown-child');
    await expectNotFound(request, '/c/');
  });

  test('a real browser follows exactly one redirect to a rendered canonical page', async ({ page }) => {
    const response = await page.goto(CHILD.legacyPath);

    expect(response?.status()).toBe(200);
    expect(decodeURI(page.url())).toContain(CHILD.canonicalPath);

    // The navigation chain is exactly one redirect: 301 -> 200.
    const redirectRequest = response!.request().redirectedFrom();
    expect(redirectRequest, 'the document request was redirected once').not.toBeNull();
    expect((await redirectRequest!.response())?.status()).toBe(301);
    expect(redirectRequest!.redirectedFrom(), 'no second redirect hop').toBeNull();

    await expect(page.getByText(CHILD.name, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CHILD.canonicalPath);
  });

  test('in-app navigation to a legacy path replaces the route with the canonical URL', async ({ page }) => {
    await page.goto(HOME.canonicalPath);
    await expect(page.getByText(HOME.name, { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    await page.evaluate((legacyPath) => {
      window.history.pushState({}, '', legacyPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, DUPLICATE_B.legacyPath);

    await expect(page).toHaveURL(new RegExp(`${DUPLICATE_B.canonicalPath}$`));
    await expect(page.getByText(DUPLICATE_B.name, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  });
});
