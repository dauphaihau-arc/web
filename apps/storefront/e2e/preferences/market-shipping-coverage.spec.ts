import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from '../support/hydration';
import { installStorefrontApiMocks } from '../support/network';

/**
 * Catalog-only ship-to destination.
 *
 * `catalog_ship_to` narrows a catalog list, its counts, and its facets. An
 * absent key follows the current Market's Preview Destination. Suggestions and
 * recommendation rails stay Market-scoped and must never carry the catalog
 * destination.
 */

const MARKETS = [
  {
    code: 'US',
    name: 'United States',
    preview_country_code: 'US',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR'],
    defaultLocale: 'en-US',
    supportedLocales: ['en-US', 'vi-US'],
    enabled: true,
  },
  {
    code: 'VN',
    name: 'Vietnam',
    preview_country_code: 'VN',
    defaultCurrency: 'VND',
    supportedCurrencies: ['USD', 'VND'],
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
    enabled: true,
  },
];

function buildProduct(
  id: string,
  title: string,
  shipping?: { available?: boolean, countries?: string[] },
) {
  return {
    id,
    shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
    title,
    slug: id,
    pricing: {
      min_amount_minor: 1200,
      max_amount_minor: 1200,
      currency: 'USD',
    },
    availability: { in_stock: true, low_stock: false, stock_total: 5 },
    ...(shipping ? { shipping } : {}),
    variant_count: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

const AVAILABLE_TITLE = 'Trail Mug';
const WORLDWIDE_TITLE = 'Worldwide Tote';
const DIGITAL_TITLE = 'Digital Pattern';
const UNAVAILABLE_TITLE = 'Desk Lamp';
const UK_TITLE = 'London Print';

function listingProducts() {
  return [
    buildProduct('product-trail-mug', AVAILABLE_TITLE, { countries: ['US', 'VN'] }),
    buildProduct('product-worldwide-tote', WORLDWIDE_TITLE, { available: true }),
    buildProduct('product-digital-pattern', DIGITAL_TITLE, { available: true }),
    buildProduct('product-desk-lamp', UNAVAILABLE_TITLE, { available: false }),
    buildProduct('product-london-print', UK_TITLE, { countries: ['GB'] }),
  ];
}

function productCard(page: Page, title: string) {
  return page.getByTestId('product-card').filter({ hasText: title, visible: true });
}

function shipToFilter(page: Page) {
  return page.getByTestId('ship-to-filter').filter({ visible: true }).first();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function chooseShipTo(page: Page, label: string) {
  await shipToFilter(page).click();
  // Country options carry a flag emoji prefix and "My region (…)" also names a
  // country, so match the label at the end of the accessible option name.
  await page.getByRole('option', { name: new RegExp(`${escapeRegExp(label)}$`) }).click();
}

function searchParam(page: Page, key: string) {
  return new URL(page.url()).searchParams.get(key);
}

async function switchMarketTo(page: Page, region: string) {
  await page.getByTestId('market-preferences-trigger').scrollIntoViewIfNeeded();
  await page.getByTestId('market-preferences-trigger').click();

  const dialog = page.locator('[data-testid="market-preferences-dialog"]').filter({
    has: page.getByText('Update your settings'),
  }).last();
  await expect(page.getByText('Update your settings')).toBeVisible();

  const regionField = dialog.getByLabel('Region', { exact: true });
  await regionField.click();
  await page.getByRole('option', { name: region, exact: true }).click();
  await expect(regionField).toContainText(region);

  await dialog.getByTestId('market-preferences-save').click();
  await expect(page.getByText('Update your settings')).toBeHidden();
}

test('follows the Market implicitly by default and can filter to any country or all destinations', async ({ page }) => {
  const listingRequests: URL[] = [];
  const facetRequests: URL[] = [];

  page.on('request', (request) => {
    if (request.method() !== 'GET') {
      return;
    }

    const url = new URL(request.url());

    if (url.pathname.endsWith('/v1/products')) {
      listingRequests.push(url);
    }

    if (url.pathname.endsWith('/v1/products/facets')) {
      facetRequests.push(url);
    }
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
  });

  await page.goto('/search?q=ring');
  await waitForHydration(page);

  // Default is the current Market's country, expressed implicitly: no URL key
  // and no request parameter, so a later Market change follows the new Market.
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBeNull();
  await expect(shipToFilter(page)).toContainText('My region (United States)');
  await expect(page.getByText('3 results for "ring"').filter({ visible: true })).toBeVisible();
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(productCard(page, WORLDWIDE_TITLE)).toBeVisible();
  await expect(productCard(page, DIGITAL_TITLE)).toBeVisible();
  await expect(productCard(page, UNAVAILABLE_TITLE)).toHaveCount(0);
  await expect(productCard(page, UK_TITLE)).toHaveCount(0);
  await expect.poll(() => listingRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === null)).toBe(true);
  await expect.poll(() => facetRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === null)).toBe(true);

  // A different explicit country filters against that country, not the Market.
  await chooseShipTo(page, 'United Kingdom');

  await expect(shipToFilter(page)).toContainText('United Kingdom');
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('GB');
  await expect(productCard(page, UK_TITLE)).toBeVisible();
  await expect(productCard(page, AVAILABLE_TITLE)).toHaveCount(0);
  await expect(productCard(page, UNAVAILABLE_TITLE)).toHaveCount(0);
  await expect.poll(() => listingRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === 'GB')).toBe(true);
  await expect.poll(() => facetRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === 'GB')).toBe(true);

  // "All destinations" restores unsupported cards with their badge.
  await chooseShipTo(page, 'All destinations');

  await expect(shipToFilter(page)).toContainText('All destinations');
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('all');
  await expect(page.getByText('5 results for "ring"').filter({ visible: true })).toBeVisible();
  await expect(productCard(page, UNAVAILABLE_TITLE)).toBeVisible();
  await expect(productCard(page, UNAVAILABLE_TITLE).getByTestId('product-card-shipping-badge')).toBeVisible();
  await expect(productCard(page, UK_TITLE)).toBeVisible();
  await expect.poll(() => listingRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === 'all')).toBe(true);
  await expect.poll(() => facetRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === 'all')).toBe(true);
});

test('applies the catalog destination on category listings', async ({ page }) => {
  const listingRequests: URL[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname.endsWith('/v1/products')) {
      listingRequests.push(url);
    }
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
  });

  await page.goto('/c/jewelry-c101');
  await waitForHydration(page);

  await expect(productCard(page, UNAVAILABLE_TITLE)).toHaveCount(0);
  await expect.poll(() => listingRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === null
    && url.searchParams.get('category_id') === '101',
  )).toBe(true);

  await chooseShipTo(page, 'United Kingdom');

  await expect(productCard(page, UK_TITLE)).toBeVisible();
  await expect(productCard(page, AVAILABLE_TITLE)).toHaveCount(0);
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('GB');
  await expect.poll(() => listingRequests.some(url =>
    url.searchParams.get('catalog_ship_to') === 'GB'
    && url.searchParams.get('category_id') === '101',
  )).toBe(true);
});

test('hydrates an explicit country from the URL and follows browser history', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
  });

  await page.goto('/search?q=ring&catalog_ship_to=GB');
  await waitForHydration(page);

  await expect(shipToFilter(page)).toContainText('United Kingdom');
  await expect(productCard(page, UK_TITLE)).toBeVisible();
  await expect(productCard(page, AVAILABLE_TITLE)).toHaveCount(0);

  await chooseShipTo(page, 'United States');
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('US');
  await expect(shipToFilter(page)).toContainText('United States');
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(productCard(page, UK_TITLE)).toHaveCount(0);

  await page.goBack();

  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('GB');
  await expect(shipToFilter(page)).toContainText('United Kingdom');
  await expect(productCard(page, UK_TITLE)).toBeVisible();
  await expect(productCard(page, AVAILABLE_TITLE)).toHaveCount(0);

  await page.goForward();

  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('US');
  await expect(shipToFilter(page)).toContainText('United States');
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
});

test('reset removes the catalog destination and returns to the implicit Market', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
  });

  await page.goto('/search?q=ring&catalog_ship_to=all&who_made=i_did');
  await waitForHydration(page);

  await expect(shipToFilter(page)).toContainText('All destinations');
  await expect(productCard(page, UNAVAILABLE_TITLE)).toBeVisible();

  await page.getByRole('button', { name: 'Reset filters' }).click();

  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBeNull();
  await expect.poll(() => searchParam(page, 'who_made')).toBeNull();
  await expect(shipToFilter(page)).toContainText('My region (United States)');
  await expect(productCard(page, UNAVAILABLE_TITLE)).toHaveCount(0);
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
});

test('keeps an explicit country across a Market change, and reset then follows the new Market', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
  });

  await page.goto('/search?q=ring&catalog_ship_to=GB&who_made=i_did');
  await waitForHydration(page);

  await expect(shipToFilter(page)).toContainText('United Kingdom');

  await switchMarketTo(page, 'Vietnam');

  // The explicit country is a catalog choice, not a Market preference: it
  // survives the Market change and keeps driving the list request.
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBe('GB');
  await expect(shipToFilter(page)).toContainText('United Kingdom');
  await expect(productCard(page, UK_TITLE)).toBeVisible();
  await expect(productCard(page, AVAILABLE_TITLE)).toHaveCount(0);

  await page.getByRole('button', { name: 'Reset filters' }).click();

  // Resetting returns to implicit, which now means the new Market's country.
  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBeNull();
  await expect.poll(() => searchParam(page, 'who_made')).toBeNull();
  await expect(shipToFilter(page)).toContainText('My region (Vietnam)');
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(productCard(page, UK_TITLE)).toHaveCount(0);
});

test('returns to the implicit Market from an explicit country and follows later Market changes', async ({ page }) => {
  const listingRequests: Array<{ url: URL, market: string }> = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname.endsWith('/v1/products')) {
      listingRequests.push({
        url,
        market: request.headers()['x-market-code'] ?? '',
      });
    }
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
  });

  await page.goto('/search?q=ring&catalog_ship_to=GB');
  await waitForHydration(page);

  await expect(shipToFilter(page)).toContainText('United Kingdom');

  await chooseShipTo(page, 'My region (United States)');

  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBeNull();
  await expect(shipToFilter(page)).toContainText('My region (United States)');
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(productCard(page, UK_TITLE)).toHaveCount(0);

  // Implicit state follows a Market change without writing a URL key.
  await switchMarketTo(page, 'Vietnam');

  await expect.poll(() => searchParam(page, 'catalog_ship_to')).toBeNull();
  await expect(shipToFilter(page)).toContainText('My region (Vietnam)');
  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(productCard(page, UK_TITLE)).toHaveCount(0);
  await expect.poll(() => listingRequests.some(({ url, market }) =>
    market === 'VN' && url.searchParams.get('catalog_ship_to') === null)).toBe(true);
});

test('refetches Market-scoped search suggestions and drops the previous Market items', async ({ page }) => {
  const suggestionMarketCodes: string[] = [];
  const suggestionCatalogDestinations: Array<string | null> = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname.endsWith('/v1/products/suggestions')) {
      suggestionMarketCodes.push(request.headers()['x-market-code'] ?? '');
      suggestionCatalogDestinations.push(url.searchParams.get('catalog_ship_to'));
    }
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: listingProducts(), VN: listingProducts() },
    suggestionsByMarket: {
      US: [{
        id: 'suggestion-us',
        title: 'Suggested Trail',
        slug: 'suggested-trail',
        shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      }],
      VN: [{
        id: 'suggestion-vn',
        title: 'Suggested Desk',
        slug: 'suggested-desk',
        shop: { id: 'shop-e2e-1', shop_name: 'Arc Supplies', slug: 'arc-supplies' },
      }],
    },
  });

  await page.goto('/search?q=ring&catalog_ship_to=GB');
  await waitForHydration(page);

  // Switch first: the search panel is closed, so the Market change cannot race
  // the panel's leave transition. Then open it and query under the VN Market.
  await switchMarketTo(page, 'Vietnam');

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.getByTestId('header-search-trigger').click();

  const input = page.getByPlaceholder('Search...');
  await expect(input).toBeVisible();
  await input.fill('');
  await input.fill('ring');

  await expect.poll(() => suggestionMarketCodes).toContain('VN');

  const suggestions = page.getByTestId('product-suggestion');
  await expect(suggestions.filter({ hasText: 'Suggested Desk' })).toBeVisible();
  await expect(suggestions.filter({ hasText: 'Suggested Trail' })).toHaveCount(0);

  // Suggestions stay Market-scoped: the catalog destination is never sent.
  expect(suggestionCatalogDestinations.every(value => value === null)).toBe(true);
});

test('refetches recommendation rails for the new Market without stale items', async ({ page }) => {
  const railMarketCodes: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname.endsWith('/recommendation-sections')) {
      railMarketCodes.push(request.headers()['x-market-code'] ?? '');
    }
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    recommendationSectionsByMarket: {
      US: [{
        type: 'similar_products',
        title: 'Similar items',
        items: [buildProduct('rail-us', 'Rail Trail Mug', { available: true })],
      }],
      VN: [{
        type: 'similar_products',
        title: 'Similar items',
        items: [buildProduct('rail-vn', 'Rail Desk Lamp', { available: true })],
      }],
    },
  });

  await page.goto('/artisan-shop/handmade-ring');
  await waitForHydration(page);

  const rail = page.getByTestId('recommendation-sections');
  const railItem = (slug: string) => rail.locator(`a[href$="/arc-supplies/${slug}"]`);

  // The rail sits below the fold; scrolling it into view triggers its lazy
  // hydration so the first Market's request is actually issued.
  await rail.scrollIntoViewIfNeeded();
  await expect.poll(() => railMarketCodes).toContain('US');
  await expect(railItem('rail-us')).toBeVisible();

  await switchMarketTo(page, 'Vietnam');
  await expect.poll(() => railMarketCodes).toContain('VN');

  await expect(railItem('rail-vn')).toBeVisible();
  await expect(railItem('rail-us')).toHaveCount(0);
});
