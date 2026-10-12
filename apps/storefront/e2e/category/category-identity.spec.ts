import {
  expect,
  test,
  type Page,
  type Route,
} from '@playwright/test';
import { CATEGORY_IDENTITY_CONTRACT } from '@arc/enums/category';
import { SessionStorageKeys } from '@arc/enums/session-storage-keys';
import { LocalStorageKeys } from '@arc/enums/local-storage-keys';
import { installStorefrontApiMocks } from '../support/network';

const OLD_INTERNAL_CATEGORY_ID = 'internal-uuid-legacy';
const PUBLIC_CATEGORY_ID = '9007199254740993';

/** Read session storage, tolerating a navigation that destroys the page context. */
function readSession(page: Page, key: string) {
  return page.evaluate(name => sessionStorage.getItem(name), key).catch(() => null);
}

/**
 * Non-gated product rails are unrelated to category identity. Mock them so a
 * failing request cannot trip the app's backend wake-up overlay and hide the
 * category surfaces the tests assert on.
 */
function mockProductRails(page: Page) {
  return page.route(/\/products\/(trending|best-sellers|recently-viewed)/, route =>
    route.fulfill({ json: { items: [] } }));
}

test('invalidates only category-bearing state for an outdated persisted contract and reloads once', async ({ page }) => {
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem('e2e-load-count') ?? '0');
    sessionStorage.setItem('e2e-load-count', String(loads + 1));

    if (localStorage.getItem('e2e-category-seeded')) {
      return;
    }

    localStorage.setItem('e2e-category-seeded', '1');
    // Keys the app never reads: they prove invalidation is selective (no clear()).
    localStorage.setItem('e2e-unrelated-preference', 'keep-me');
    sessionStorage.setItem('e2e-unrelated-session', 'keep-me-too');
    sessionStorage.setItem('categories_breadcrumb', JSON.stringify([
      { id: 'internal-uuid-legacy', name: 'Legacy', to: '/c/legacy' },
    ]));
    sessionStorage.setItem('user-activities', JSON.stringify({
      categoryIdProductVisited: 'internal-uuid-legacy',
      searchHistory: ['mugs'],
    }));
    sessionStorage.setItem('category-identity-contract-version', '1');
    localStorage.setItem('guest-preferences', JSON.stringify({
      currency: 'EUR',
      language: 'en',
      region: 'United States',
    }));
    localStorage.setItem('recent-product-views', JSON.stringify([
      { product: { id: 'p1', category_id: 'internal-uuid-legacy', title: 'Mug' }, viewedAt: '2026-01-01T00:00:00.000Z' },
    ]));
  });

  await installStorefrontApiMocks(page, { currentUser: null });

  const categoryRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/\/categories(\?|$)/.test(url.pathname) || /\/products(\?|$)/.test(url.pathname)) {
      categoryRequests.push(request.url());
    }
  });

  await page.goto('/');

  // The plugin reloads the page on the stale persisted contract, so evaluations
  // may collide with a navigation; retry until the post-reload state is visible.
  await expect.poll(() => readSession(page, 'category-identity-contract-version'))
    .toBe(CATEGORY_IDENTITY_CONTRACT.VERSION);

  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  const state = await page.evaluate(keys => ({
    breadcrumb: sessionStorage.getItem(keys.breadcrumb),
    activities: sessionStorage.getItem(keys.activities),
    preferences: localStorage.getItem(keys.preferences),
    recentViews: localStorage.getItem(keys.recentViews),
  }), {
    breadcrumb: SessionStorageKeys.CATEGORIES_BREADCRUMB,
    activities: SessionStorageKeys.USER_ACTIVITIES,
    preferences: LocalStorageKeys.GUEST_PREFERENCES,
    recentViews: LocalStorageKeys.RECENT_PRODUCT_VIEWS,
  });

  // Category-bearing state is invalidated.
  expect(state.breadcrumb ?? '[]').toBe('[]');
  const activities = JSON.parse(state.activities ?? '{}');
  expect(activities.categoryIdProductVisited).toBeUndefined();
  expect(activities.rootCategoryProductVisited).toBeUndefined();
  expect(activities.subCategoriesLastVisit).toBeUndefined();

  // Unrelated persisted state survives: invalidation is surgical, never a clear().
  // (`user-activities`' other fields are covered by the unit test; the app's
  // own SSR hydration rebuilds that object here.)
  expect(await page.evaluate(() => localStorage.getItem('e2e-unrelated-preference'))).toBe('keep-me');
  expect(await page.evaluate(() => sessionStorage.getItem('e2e-unrelated-session'))).toBe('keep-me-too');
  expect(state.preferences).not.toBeNull();
  const recentViews = JSON.parse(state.recentViews ?? '[]');
  expect(recentViews.some((view: { product?: { category_id?: string } }) => view.product?.category_id === OLD_INTERNAL_CATEGORY_ID)).toBe(false);

  // No request carried the stale internal identity.
  expect(categoryRequests.filter(url => url.includes(OLD_INTERNAL_CATEGORY_ID))).toEqual([]);
});

test('blocks an internal-semantic client when the API activates the public contract', async ({ page }) => {
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem('e2e-load-count') ?? '0');
    sessionStorage.setItem('e2e-load-count', String(loads + 1));
  });

  await installStorefrontApiMocks(page, { currentUser: null });
  await mockProductRails(page);

  await page.route(/\/categories\/contract/, route =>
    route.fulfill({ json: { version: '3' } }));

  const categoryBearingRequests: string[] = [];
  let contractProbes = 0;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/categories/contract')) {
      contractProbes += 1;
      return;
    }
    if (/\/categories(\?|$)/.test(url.pathname) || /\/products(\?|$)/.test(url.pathname)) {
      categoryBearingRequests.push(request.url());
    }
  });

  await page.goto('/');

  // The client probed the contract, detected a newer contract, and reloaded once.
  await expect.poll(() => contractProbes).toBeGreaterThan(0);
  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  // It refused to send any category-bearing request under the stale contract.
  await page.waitForTimeout(1500);
  expect(categoryBearingRequests).toEqual([]);

  // The affected surfaces show the shared update card instead of a skeleton.
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();
});

test('reloads when the backend rejects the client category identity generation', async ({ page }) => {
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem('e2e-load-count') ?? '0');
    sessionStorage.setItem('e2e-load-count', String(loads + 1));
  });

  await installStorefrontApiMocks(page, { currentUser: null });
  await mockProductRails(page);

  // The probe confirms the client's generation (the check-then-send race window),
  // but the backend rejects every category-bearing request consistently, so no
  // request ever succeeds and the reload is not re-armed.
  await page.route(/\/categories\/contract/, route =>
    route.fulfill({ json: { version: CATEGORY_IDENTITY_CONTRACT.VERSION } }));

  const rejectGatedRequest = (route: Route) => route.fulfill({
    status: 409,
    json: {
      status_code: 409,
      code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH',
      message: 'reload required',
    },
  });
  await page.route(/\/categories(\?|$)/, rejectGatedRequest);
  await page.route(/\/products\/facets/, rejectGatedRequest);
  await page.route(/\/products(\?|$)/, rejectGatedRequest);

  let contractProbes = 0;
  const gatedRequests: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());

    if (pathname.endsWith('/categories/contract')) {
      contractProbes += 1;
      return;
    }

    // The generation-gated GETs: a rejected one must surface exactly once, so a
    // transport retry would show up here as an extra request.
    if (
      request.method() === 'GET'
      && (/\/categories(\?|$)/.test(pathname) || pathname === '/products' || pathname === '/products/facets')
    ) {
      gatedRequests.push(request.url());
    }
  });

  await page.goto('/');

  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');

  // The 409 latched the mismatch and reloaded exactly once.
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();
  await expect.poll(() => contractProbes).toBe(2);

  // Exactly one gated GET per fresh document: the rejected request was not
  // retried inside the transport (a retry would double this count).
  await expect.poll(() => gatedRequests.length).toBe(2);
  await page.waitForTimeout(1500);
  expect(gatedRequests.length).toBe(2);
  const probesAfterReload = contractProbes;

  // Focus / reconnect after the latch must not re-probe, re-request, or reload again.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
  });
  await page.waitForTimeout(8000);
  expect(contractProbes).toBe(probesAfterReload);
  expect(gatedRequests.length).toBe(2);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');

  // Client-side remount of the blocked consumers must not send another gated GET.
  await page.getByTestId('header-cart-trigger').click();
  await page.getByRole('link', { name: 'Review Cart' }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.locator('#brand').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();
  expect(contractProbes).toBe(2);
  expect(gatedRequests.length).toBe(2);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');
});

test('browses a category with the public category identity', async ({ page }) => {
  await page.addInitScript((version) => {
    sessionStorage.setItem('category-identity-contract-version', version);
  }, CATEGORY_IDENTITY_CONTRACT.VERSION);

  await installStorefrontApiMocks(page, { currentUser: null });

  await page.route(/\/categories\/contract/, route =>
    route.fulfill({ json: { version: CATEGORY_IDENTITY_CONTRACT.VERSION } }));

  await page.route(/\/categories(\?|$)/, (route) => {
    return route.fulfill({
      json: [{
        id: PUBLIC_CATEGORY_ID,
        parent_id: null,
        name: 'Laptops',
        rank: 1,
        image_url: null,
        featured_facet_keys: [],
        attributes: [],
      }],
    });
  });

  const facetsRequests: string[] = [];
  await page.route(/\/products\/facets/, (route) => {
    facetsRequests.push(route.request().url());
    return route.fulfill({
      json: {
        facets: [{
          facet_key: 'brand',
          attribute_name: 'Brand',
          options: [{ option_key: 'acme', value: 'Acme' }],
        }],
      },
    });
  });

  const listRequests: string[] = [];
  await page.route(/\/products(\?|$)/, (route) => {
    listRequests.push(route.request().url());
    return route.fulfill({
      json: {
        items: [
          {
            id: 'product-e2e-1',
            shop: { id: 'shop-e2e-1', shop_name: 'E2E Shop', slug: 'e2e-shop' },
            category_id: PUBLIC_CATEGORY_ID,
            title: 'Gaming Laptop',
            slug: 'gaming-laptop',
            availability: { in_stock: true, low_stock: false, stock_total: 5 },
            variant_count: 1,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 16,
          total: 1,
          total_pages: 1,
          has_next_page: false,
          has_previous_page: false,
        },
      },
    });
  });

  // Model the server gate: browsing must fail if this bundle omits or changes
  // its own generation header, rather than having the fixture supply it.
  await page.route(/\/(?:categories|products(?:\/facets)?)(\?|$)/, (route) => {
    if (route.request().headers()['x-category-identity-generation'] !== '2') {
      return route.fulfill({
        status: 409,
        json: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' },
      });
    }

    return route.fallback();
  });

  await page.goto('/');

  await page.getByText('Laptops', { exact: true }).first().click();

  await expect(page).toHaveURL(/\/c\/laptops$/);

  await expect
    .poll(() => listRequests.some(url => new URL(url).searchParams.get('category_id') === PUBLIC_CATEGORY_ID))
    .toBe(true);
  await expect(page.getByText('Gaming Laptop')).toBeVisible();

  await expect.poll(() => facetsRequests.length).toBeGreaterThan(0);
  expect(facetsRequests.every(url => new URL(url).searchParams.get('category_id') === PUBLIC_CATEGORY_ID)).toBe(true);
});

test('latches the mismatch, reloads once, then blocks without refetching', async ({ page }) => {
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem('e2e-load-count') ?? '0');
    sessionStorage.setItem('e2e-load-count', String(loads + 1));
  });

  await installStorefrontApiMocks(page, { currentUser: null });
  await mockProductRails(page);
  // The API advertises a newer generation than this client bundle speaks.
  await page.route(/\/categories\/contract/, route => route.fulfill({ json: { version: '3' } }));

  let contractProbes = 0;
  const categoryRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/categories/contract')) {
      contractProbes += 1;
      return;
    }
    if (/\/categories(\?|$)/.test(url.pathname) || /\/products(\?|$)/.test(url.pathname)) {
      categoryRequests.push(request.url());
    }
  });

  await page.goto('/');

  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();

  // One shared probe on each document: initial load and the single reload.
  await expect.poll(() => contractProbes).toBe(2);
  expect(categoryRequests).toEqual([]);

  // Focus / reconnect must not re-probe, re-request, or reload.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
  });
  await page.waitForTimeout(8000);
  expect(contractProbes).toBe(2);
  expect(categoryRequests).toEqual([]);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();

  // The block is scoped to category surfaces: an unrelated route has no card.
  await page.getByTestId('header-cart-trigger').click();
  await page.getByRole('link', { name: 'Review Cart' }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByTestId('category-identity-update-card')).toHaveCount(0);

  // Returning through client-side navigation remounts the homepage consumers.
  await page.locator('#brand').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();
  expect(contractProbes).toBe(2);
  expect(categoryRequests).toEqual([]);
  expect(await readSession(page, 'e2e-load-count')).toBe('2');
});

test('hides category browsing controls while an update is required', async ({ page }) => {
  await installStorefrontApiMocks(page, { currentUser: null });
  await page.route(/\/categories\/contract/, route => route.fulfill({ json: { version: '3' } }));

  await page.goto('/c/electronics');

  await expect(page.getByTestId('category-identity-update-card')).toHaveCount(1);
  await expect(page.getByTestId('category-identity-update-card')).toBeVisible();
  await expect(page.getByText('Sort by:', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('manual Check for update recovers when the API returns a compatible contract', async ({ page }) => {
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem('e2e-load-count') ?? '0');
    sessionStorage.setItem('e2e-load-count', String(loads + 1));
  });

  await installStorefrontApiMocks(page, { currentUser: null });
  await mockProductRails(page);

  let contractVersion = '3';
  await page.route(/\/categories\/contract/, route => route.fulfill({ json: { version: contractVersion } }));

  const categoryRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/categories(\?|$)/.test(new URL(request.url()).pathname)) {
      categoryRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect.poll(() => readSession(page, 'e2e-load-count')).toBe('2');
  await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();

  // The server now advertises the client's generation (rollback or a compatible
  // bundle), so an explicit check must recover rather than stay blocked.
  contractVersion = CATEGORY_IDENTITY_CONTRACT.VERSION;

  await page.getByTestId('category-identity-check-update').first().click();

  await expect(page.getByTestId('category-identity-update-card')).toHaveCount(0);
  // Observable useful result: category requests resume with the recovered guard.
  await expect.poll(() => categoryRequests.length).toBeGreaterThan(0);
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows the scoped update card on a narrow screen', async ({ page }) => {
    await installStorefrontApiMocks(page, { currentUser: null });
    await mockProductRails(page);
    await page.route(/\/categories\/contract/, route => route.fulfill({ json: { version: '3' } }));

    await page.goto('/');

    await expect(page.getByTestId('category-identity-update-card').first()).toBeVisible();
    await expect(page.getByTestId('category-identity-check-update').first()).toBeVisible();
  });
});
