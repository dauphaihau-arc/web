import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

/**
 * SSR browser regression for flat category URLs (`/c/:slug-c:publicId`).
 *
 * Runs only in SSR mode (`pnpm e2e:ssr`): Playwright launches the real storefront
 * server (`.output/server/index.mjs`) plus the deterministic backend fixture in
 * `../support/ssr-fixtures.mjs`. A fresh browser context proves direct access,
 * home navigation, and reload without any manually populated session
 * breadcrumbs, and the fixture request log proves which requests each page
 * actually issued.
 */

const FIXTURE_ORIGIN = `http://127.0.0.1:${process.env.E2E_FIXTURE_PORT ?? 4310}`;

const FLAT_LAPTOPS_URL = '/c/gaming-laptops-c1';
const FLAT_MICE_URL = '/c/gaming-mice-c3';
const FLAT_PAGINATION_URL = '/c/pagination-lab-c20';
const FLAT_FILTER_LAB_URL = '/c/filter-lab-c30';

type FixtureRequest = {
  method: string
  path: string
  search: string
  unexpected: boolean
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

function productRequests(requests: FixtureRequest[]) {
  return requests.filter(
    entry => entry.path === '/v1/products' || entry.path === '/v1/products/facets',
  );
}

async function expectProductsVisible(page: Page, titles: string[]) {
  for (const title of titles) {
    await expect(page.getByText(title, { exact: true })).toBeVisible({ timeout: 20_000 });
  }
}

/**
 * Assert the category layout an incident would flag: the market chrome and the
 * two-column body must keep their geometry on a hard navigation, not merely
 * render the right words. Guards against the regression where the whole market
 * layout ended up nested inside the full-screen `AppSplash` overlay after a
 * reload, which pushed the fixed header off-screen and re-centred the page.
 */
async function expectIntactCategoryLayout(page: Page) {
  const viewportWidth = page.viewportSize()?.width ?? 0;

  // The fixed market header spans the viewport from its left edge.
  const header = await page.locator('header').first().boundingBox();
  expect(header, 'market header is rendered').not.toBeNull();
  expect(header!.x, 'header must start at the viewport left edge').toBeLessThanOrEqual(1);
  expect(header!.x + header!.width, 'header must not overflow the viewport').toBeLessThanOrEqual(viewportWidth + 1);

  // Brand sits on the left third of the header, not pushed to the centre.
  const brand = await page.locator('#brand').boundingBox();
  expect(brand, 'brand link is rendered').not.toBeNull();
  expect(brand!.x).toBeLessThan(viewportWidth * 0.3);

  // Toolbar: category title on the left, sort control on the right, both on-screen.
  // Scope to the title element (the header nav also renders category names).
  const title = await page.locator('div.text-2xl > span').first().boundingBox();
  const sort = await page.getByText('Sort by:').first().boundingBox();
  expect(title, 'category title is rendered').not.toBeNull();
  expect(sort, 'sort control is rendered').not.toBeNull();
  expect(title!.x, 'category title is left of the sort control').toBeLessThan(sort!.x);
  expect(sort!.x + sort!.width, 'sort control stays on-screen').toBeLessThanOrEqual(viewportWidth + 1);

  // Sidebar is a fixed-width column left of the product grid.
  const sidebar = await page.getByText('Brand', { exact: true }).first().boundingBox();
  const product = await page.getByText('Aurora Gaming Laptop', { exact: true }).first().boundingBox();
  expect(sidebar, 'facet sidebar is rendered').not.toBeNull();
  expect(product, 'product grid is rendered').not.toBeNull();
  expect(sidebar!.x + sidebar!.width, 'sidebar is left of the products').toBeLessThanOrEqual(product!.x + 1);
  expect(product!.x + product!.width, 'product grid stays on-screen').toBeLessThanOrEqual(viewportWidth + 1);

  // The page body must not be nested inside a full-screen fixed overlay: that is
  // the splash-stuck-on-top failure that breaks the layout after a reload.
  const fixedAncestorClass = await page.evaluate(() => {
    let element: Element | null = document.querySelector('footer');

    while (element && element !== document.body) {
      if (getComputedStyle(element).position === 'fixed') {
        return (element as HTMLElement).className;
      }

      element = element.parentElement;
    }

    return null;
  });

  expect(fixedAncestorClass, 'category content must not be nested inside a fixed overlay').toBeNull();
}

test.describe('flat category direct access and reload (SSR)', () => {
  // Match the reported desktop viewport so geometry failures reproduce.
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ request }) => {
    await resetFixture(request);
  });

  test('direct access in a fresh context resolves identity from the URL and renders products, facets, and ancestry', async ({ page, request }) => {
    // No session storage is seeded: the URL alone must resolve the category.
    const response = await page.goto(FLAT_LAPTOPS_URL);
    expect(response?.status()).toBe(200);

    await expectProductsVisible(page, ['Aurora Gaming Laptop', 'Nimbus Gaming Laptop']);

    // Facets describe the same category.
    await expect(page.getByText('Brand', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Aurora', { exact: true }).first()).toBeVisible();

    // The served canonical URL is emitted for the resolved root identity. A
    // single-entry ancestry intentionally renders no breadcrumb trail, so the
    // root page proves the canonical flat URL through the document head.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', FLAT_LAPTOPS_URL);

    const requests = await fixtureRequests(request);
    // Identity was resolved from the URL against the backend.
    expect(requests.some(entry => entry.path === '/v1/categories/1')).toBe(true);
    expect(productRequests(requests).some(entry => entry.search.includes('category_id=1'))).toBe(true);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('home navigation links to the flat canonical URL and renders the category', async ({ page, request }) => {
    await page.goto('/');

    await page.getByText('Gaming Laptops', { exact: true }).first().click();

    await expect(page).toHaveURL(new RegExp(`${FLAT_LAPTOPS_URL}$`));
    await expectProductsVisible(page, ['Aurora Gaming Laptop', 'Nimbus Gaming Laptop']);

    const requests = await fixtureRequests(request);
    expect(productRequests(requests).some(entry => entry.search.includes('category_id=1'))).toBe(true);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('client navigation home -> root -> child -> ancestor breadcrumb keeps resolution in sync', async ({ page, request }) => {
    await page.goto('/');

    await page.getByText('Gaming Laptops', { exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${FLAT_LAPTOPS_URL}$`));
    await expectProductsVisible(page, ['Aurora Gaming Laptop', 'Nimbus Gaming Laptop']);

    // Guard: after the transition into the child, no request may resolve the
    // previous category. The reactive query key and the resolver fetch must
    // agree; a queryFn pinned to the id captured when the composable ran would
    // refetch category 1 into the child's cache entry.
    const staleResolutionRefetch = page
      .waitForResponse(entry => entry.url().includes('/v1/categories/1'), { timeout: 2000 })
      .catch(() => null);

    await page.getByText('Gaming Mice', { exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${FLAT_MICE_URL}$`));
    await expectProductsVisible(page, ['Precision Gaming Mouse']);
    await expect(page.getByText('Aurora Gaming Laptop', { exact: true })).toHaveCount(0);
    expect(await staleResolutionRefetch).toBeNull();

    // Returning through the served ancestry is another in-place param change.
    const ancestorLink = page.locator(`a[href="${FLAT_LAPTOPS_URL}"]`).first();
    await expect(ancestorLink).toHaveText(/Gaming Laptops/);
    await ancestorLink.click();
    await expect(page).toHaveURL(new RegExp(`${FLAT_LAPTOPS_URL}$`));
    await expectProductsVisible(page, ['Aurora Gaming Laptop', 'Nimbus Gaming Laptop']);
    await expect(page.getByText('Precision Gaming Mouse', { exact: true })).toHaveCount(0);

    await page.reload();
    await expectProductsVisible(page, ['Aurora Gaming Laptop', 'Nimbus Gaming Laptop']);

    const requests = await fixtureRequests(request);
    expect(requests.some(entry => entry.path === '/v1/categories/1')).toBe(true);
    expect(requests.some(entry => entry.path === '/v1/categories/3')).toBe(true);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('reload keeps products and facets visible (hydration/reload regression)', async ({ page, request }) => {
    await page.goto(FLAT_LAPTOPS_URL);
    await expectProductsVisible(page, ['Aurora Gaming Laptop']);

    await page.reload();

    // The original failure left both sections on skeletons after a reload.
    await expectProductsVisible(page, ['Aurora Gaming Laptop', 'Nimbus Gaming Laptop']);
    await expect(page.getByText('Brand', { exact: true }).first()).toBeVisible();

    const requests = await fixtureRequests(request);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('hard navigation keeps the header, toolbar, sidebar, and product geometry intact', async ({ page }) => {
    // Direct SSR load must render the real market layout, not the splash.
    const response = await page.goto(FLAT_LAPTOPS_URL);
    expect(response?.status()).toBe(200);
    await expectProductsVisible(page, ['Aurora Gaming Laptop']);
    await expectIntactCategoryLayout(page);

    // The reported failure only shows on a fresh document load.
    await page.reload();
    await expectProductsVisible(page, ['Aurora Gaming Laptop']);
    await expectIntactCategoryLayout(page);

    // Client navigation must agree: same geometry, not a different layout.
    await page.goto('/');
    await page.getByText('Gaming Laptops', { exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${FLAT_LAPTOPS_URL}$`));
    await expectProductsVisible(page, ['Aurora Gaming Laptop']);
    await expectIntactCategoryLayout(page);
  });

  test('a child category renders the full served ancestry with canonical ancestor links', async ({ page, request }) => {
    const response = await page.goto(FLAT_MICE_URL);
    expect(response?.status()).toBe(200);

    await expectProductsVisible(page, ['Precision Gaming Mouse']);

    const ancestorLink = page.locator(`a[href="${FLAT_LAPTOPS_URL}"]`);
    await expect(ancestorLink.first()).toBeVisible();
    await expect(ancestorLink.first()).toHaveText(/Gaming Laptops/);

    const requests = await fixtureRequests(request);
    expect(requests.some(entry => entry.path === '/v1/categories/3')).toBe(true);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('a malformed identity suffix returns 404 without requesting products or facets', async ({ page, request }) => {
    const response = await page.goto('/c/gaming-laptops-c01');
    expect(response?.status()).toBe(404);

    const requests = await fixtureRequests(request);
    // Identity resolution must fail before any listing/facet request is issued.
    expect(productRequests(requests)).toEqual([]);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('an unknown category returns 404 without requesting products or facets', async ({ page, request }) => {
    const response = await page.goto('/c/gaming-laptops-c9999');
    expect(response?.status()).toBe(404);

    const requests = await fixtureRequests(request);
    expect(productRequests(requests)).toEqual([]);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('an unavailable category returns 404 without requesting products or facets', async ({ page, request }) => {
    const response = await page.goto('/c/hidden-shelf-c7');
    expect(response?.status()).toBe(404);

    const requests = await fixtureRequests(request);
    expect(productRequests(requests)).toEqual([]);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('a visible category with no products returns 200 and an empty state', async ({ page, request }) => {
    const response = await page.goto('/c/empty-shelf-c9');
    expect(response?.status()).toBe(200);

    await expect(page.getByText('No products here yet', { exact: true })).toBeVisible({ timeout: 20_000 });

    const requests = await fixtureRequests(request);
    expect(requests.some(entry => entry.path === '/v1/categories/9')).toBe(true);
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('a backend failure stays an error rather than a fabricated 404', async ({ page, request }) => {
    const response = await page.goto('/c/broken-c500');

    // The fixture answers identity resolution with HTTP 500.
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).toBeGreaterThanOrEqual(500);

    const requests = await fixtureRequests(request);
    expect(requests.some(entry => entry.path === '/v1/categories/500')).toBe(true);
    expect(productRequests(requests)).toEqual([]);
  });

  test('preserves filter and page query parameters while resolving a flat category', async ({ page, request }) => {
    await page.goto(`${FLAT_LAPTOPS_URL}?min_price=50&page=1`);
    await expectProductsVisible(page, ['Aurora Gaming Laptop']);

    const requests = await fixtureRequests(request);
    const listRequest = productRequests(requests).find(entry => entry.path === '/v1/products');
    expect(listRequest).toBeDefined();
    expect(listRequest?.search).toContain('category_id=1');
    expect(listRequest?.search).toContain('min_price=50');
  });

  test('selecting a facet threads the active filters into the facet request', async ({ page, request }) => {
    await page.goto(FLAT_LAPTOPS_URL);
    await expectProductsVisible(page, ['Aurora Gaming Laptop']);

    await page.getByText('Aurora', { exact: true }).first().click();

    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_brand') === 'aurora');

    // Facet alternatives are computed against the active filters, so the facet
    // request must carry them rather than only the category identity.
    await expect.poll(async () => {
      const requests = await fixtureRequests(request);
      return requests.some(
        entry => entry.path === '/v1/products/facets'
          && entry.search.includes('category_id=1')
          && entry.search.includes('attr_brand=aurora'),
      );
    }).toBe(true);

    const requests = await fixtureRequests(request);
    expect(requests.some(
      entry => entry.path === '/v1/products'
        && entry.search.includes('attr_brand=aurora'),
    )).toBe(true);

    // The selected facet keeps its other alternatives visible.
    await expect(page.getByText('Aurora', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Nimbus', { exact: true }).first()).toBeVisible();
    expect(requests.filter(entry => entry.unexpected)).toEqual([]);
  });

  test('a facet transition keeps unavailable options visible but disabled and preserves the selected facet alternatives', async ({ page, request }) => {
    await page.goto(FLAT_FILTER_LAB_URL);
    await expectProductsVisible(page, ['Filter Lab Black Cotton', 'Filter Lab White Linen']);

    // Baseline: both facets offer both eligible options, all selectable.
    await expect(page.locator('#attribute-facet-color-black')).toBeEnabled();
    await expect(page.locator('#attribute-facet-color-white')).toBeEnabled();
    await expect(page.locator('#attribute-facet-material-cotton')).toBeEnabled();
    await expect(page.locator('#attribute-facet-material-linen')).toBeEnabled();

    // Select Color=Black: the listing narrows, Color keeps its alternatives
    // (own filter excluded), and Material's no-longer-eligible option stays
    // visible but becomes disabled rather than disappearing.
    await page.locator('#attribute-facet-color-black').click();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_color') === 'black');
    await expectProductsVisible(page, ['Filter Lab Black Cotton']);
    await expect(page.getByText('Filter Lab White Linen', { exact: true })).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('#attribute-facet-color-white')).toBeEnabled();
    await expect(page.locator('#attribute-facet-material-cotton')).toBeEnabled();
    await expect(page.locator('#attribute-facet-material-linen')).toBeDisabled();

    // The facet request carried the active filter, so the availability was
    // computed by the backend with the own filter excluded, not locally.
    await expect.poll(async () => {
      const requests = await fixtureRequests(request);
      return requests.some(entry => entry.path === '/v1/products/facets'
        && entry.search.includes('category_id=30')
        && entry.search.includes('attr_color=black'));
    }).toBe(true);

    // Clear Color: the disabled option becomes selectable again.
    await page.locator('#attribute-facet-color-black').click();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_color') === null);
    await expect(page.locator('#attribute-facet-material-linen')).toBeEnabled({ timeout: 20_000 });

    // Select Material=Linen: the symmetric narrowing, with the selected
    // Material facet keeping its own alternatives and Color's Black disabled.
    await page.locator('#attribute-facet-material-linen').click();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_material') === 'linen');
    await expectProductsVisible(page, ['Filter Lab White Linen']);
    await expect(page.getByText('Filter Lab Black Cotton', { exact: true })).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('#attribute-facet-material-cotton')).toBeEnabled();
    await expect(page.locator('#attribute-facet-color-white')).toBeEnabled();
    await expect(page.locator('#attribute-facet-color-black')).toBeDisabled({ timeout: 20_000 });

    expect((await fixtureRequests(request)).filter(entry => entry.unexpected)).toEqual([]);
  });

  test('an unavailable option stays visible and disabled, and clears back to enabled', async ({ page, request }) => {
    await page.goto(FLAT_FILTER_LAB_URL);
    await expectProductsVisible(page, ['Filter Lab Black Cotton']);

    // Select Cotton: the only remaining product is Black+Cotton, so Color's
    // White is unavailable — but it must still be shown, disabled.
    await page.locator('#attribute-facet-material-cotton').click();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_material') === 'cotton');
    await expectProductsVisible(page, ['Filter Lab Black Cotton']);

    await expect(page.locator('#attribute-facet-color-white')).toBeVisible();
    await expect(page.locator('#attribute-facet-color-white')).toBeDisabled({ timeout: 20_000 });
    await expect(page.locator('#attribute-facet-color-black')).toBeEnabled();
    // The selected facet keeps its own alternatives selectable.
    await expect(page.locator('#attribute-facet-material-cotton')).toBeEnabled();
    await expect(page.locator('#attribute-facet-material-linen')).toBeEnabled();

    // Clearing the selection restores the unavailable option.
    await page.locator('#attribute-facet-material-cotton').click();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_material') === null);
    await expect(page.locator('#attribute-facet-color-white')).toBeEnabled({ timeout: 20_000 });

    expect((await fixtureRequests(request)).filter(entry => entry.unexpected)).toEqual([]);
  });

  test('a direct filtered load requests a category-only baseline instead of hiding the unavailable option', async ({ page, request }) => {
    // Direct load with an active filter: the baseline must come from a fresh
    // category-only facet request, not from the cached filtered response.
    await page.goto(`${FLAT_FILTER_LAB_URL}?attr_material=cotton`);
    await expectProductsVisible(page, ['Filter Lab Black Cotton']);

    await expect(page.locator('#attribute-facet-color-white')).toBeVisible();
    await expect(page.locator('#attribute-facet-color-white')).toBeDisabled({ timeout: 20_000 });
    await expect(page.locator('#attribute-facet-material-cotton')).toBeChecked();
    await expect(page.locator('#attribute-facet-material-cotton')).toBeEnabled();

    await expect.poll(async () => {
      const requests = await fixtureRequests(request);
      return requests.some(entry => entry.path === '/v1/products/facets'
        && entry.search.includes('category_id=30')
        && !entry.search.includes('attr_'));
    }).toBe(true);

    // Reload keeps the same view.
    await page.reload();
    await expect(page.locator('#attribute-facet-color-white')).toBeDisabled({ timeout: 20_000 });

    expect((await fixtureRequests(request)).filter(entry => entry.unexpected)).toEqual([]);
  });

  test('a selected option that the active filters make incompatible stays checked and removable', async ({ page, request }) => {
    // No fixture product is White+Cotton, so both selections narrow the listing
    // to nothing. The shopper's own choices must stay checked and clearable.
    await page.goto(`${FLAT_FILTER_LAB_URL}?attr_color=white&attr_material=cotton`);
    await expect(page.getByText('No results found', { exact: true })).toBeVisible({ timeout: 20_000 });

    const white = page.locator('#attribute-facet-color-white');
    await expect(white).toBeChecked();
    await expect(white).toBeEnabled();
    await expect(page.locator('#attribute-facet-material-cotton')).toBeChecked();
    await expect(page.locator('#attribute-facet-material-cotton')).toBeEnabled();

    await white.click();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('attr_color') === null);
    await expectProductsVisible(page, ['Filter Lab Black Cotton']);

    expect((await fixtureRequests(request)).filter(entry => entry.unexpected)).toEqual([]);
  });

  test('paging with active filters and sort writes the page to the URL, requests that page, and renders that page\'s products', async ({ page, request }) => {
    await page.goto(`${FLAT_PAGINATION_URL}?min_price=50&order=newest`);

    // Page 1 holds items 01–16; item 17 must come only from page 2.
    await expectProductsVisible(page, ['Pagination Lab Item 01', 'Pagination Lab Item 16']);
    await expect(page.getByText('Pagination Lab Item 17', { exact: true })).toHaveCount(0);

    const firstPageRequest = productRequests(await fixtureRequests(request))
      .find(entry => entry.path === '/v1/products' && entry.search.includes('page=1'));
    expect(firstPageRequest?.search).toContain('category_id=20');
    expect(firstPageRequest?.search).toContain('min_price=50');
    expect(firstPageRequest?.search).toContain('order=newest');

    // The paginator renders only because the fixture has 20 products and the
    // listing page size is 16.
    const pageTwo = page.getByRole('button', { name: '2', exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();

    // The page query is written while every other query parameter is preserved.
    await expect(page).toHaveURL((url) => {
      const current = new URL(url);
      return current.pathname === FLAT_PAGINATION_URL
        && current.searchParams.get('page') === '2'
        && current.searchParams.get('min_price') === '50'
        && current.searchParams.get('order') === 'newest';
    });
    await expectProductsVisible(page, ['Pagination Lab Item 17', 'Pagination Lab Item 20']);
    await expect(page.getByText('Pagination Lab Item 01', { exact: true })).toHaveCount(0);

    // Page 2 was a distinct backend request, not page 1's payload reused.
    const secondPageRequest = productRequests(await fixtureRequests(request))
      .find(entry => entry.path === '/v1/products' && entry.search.includes('page=2'));
    expect(secondPageRequest).toBeDefined();
    expect(secondPageRequest?.search).toContain('category_id=20');
    expect(secondPageRequest?.search).toContain('min_price=50');
    expect(secondPageRequest?.search).toContain('order=newest');

    // Returning to page 1 removes the page parameter and keeps filters/sort.
    await page.getByRole('button', { name: '1', exact: true }).click();
    await expect(page).toHaveURL((url) => {
      const current = new URL(url);
      return current.pathname === FLAT_PAGINATION_URL
        && current.searchParams.get('page') === null
        && current.searchParams.get('min_price') === '50'
        && current.searchParams.get('order') === 'newest';
    });
    await expectProductsVisible(page, ['Pagination Lab Item 01']);
    await expect(page.getByText('Pagination Lab Item 17', { exact: true })).toHaveCount(0);

    // Browser history restores each page from the URL, in both directions.
    await page.goBack();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('page') === '2');
    await expectProductsVisible(page, ['Pagination Lab Item 17', 'Pagination Lab Item 20']);
    await expect(page.getByText('Pagination Lab Item 01', { exact: true })).toHaveCount(0);

    await page.goForward();
    await expect(page).toHaveURL(url => new URL(url).searchParams.get('page') === null);
    await expectProductsVisible(page, ['Pagination Lab Item 01']);
    await expect(page.getByText('Pagination Lab Item 17', { exact: true })).toHaveCount(0);
  });
});
