import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from '../support/hydration';
import { installStorefrontApiMocks } from '../support/network';

/**
 * Catalog Shipping Coverage badge on the ordinary product card.
 *
 * The list response carries only `shipping.available`; a missing field is not
 * an unavailability statement, and a Market change must re-query the listing
 * instead of freezing the badge from the first response.
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
  shipping?: { available: boolean },
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
const MISSING_TITLE = 'Loose Print';

function productsForMarket(marketCode: 'US' | 'VN') {
  // The two flagged cards swap availability across Markets, so the test proves
  // the badge follows the refetched projection rather than a mount snapshot.
  return [
    buildProduct('product-trail-mug', AVAILABLE_TITLE, { available: marketCode !== 'VN' }),
    buildProduct('product-worldwide-tote', WORLDWIDE_TITLE, { available: true }),
    buildProduct('product-digital-pattern', DIGITAL_TITLE, { available: true }),
    buildProduct('product-desk-lamp', UNAVAILABLE_TITLE, { available: marketCode === 'VN' }),
    buildProduct('product-loose-print', MISSING_TITLE),
  ];
}

function productCard(page: Page, title: string) {
  // The search page renders a mobile and a desktop listing shell; only one is
  // visible at a time, so scope assertions to the visible card.
  return page.getByTestId('product-card').filter({ hasText: title, visible: true });
}

function badge(page: Page, title: string) {
  return productCard(page, title).getByTestId('product-card-shipping-badge');
}

test('shows the shipping badge only when the catalog projection says unavailable', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: { US: productsForMarket('US') },
  });

  await page.goto('/search?q=ring&catalog_ship_to=all');
  await waitForHydration(page);

  await expect(productCard(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(badge(page, AVAILABLE_TITLE)).toHaveCount(0);

  // Country coverage, worldwide coverage, and digital delivery all arrive as
  // `available: true`; none may show the unsupported-region badge.
  await expect(productCard(page, WORLDWIDE_TITLE)).toBeVisible();
  await expect(badge(page, WORLDWIDE_TITLE)).toHaveCount(0);
  await expect(productCard(page, DIGITAL_TITLE)).toBeVisible();
  await expect(badge(page, DIGITAL_TITLE)).toHaveCount(0);

  await expect(badge(page, UNAVAILABLE_TITLE)).toBeVisible();
  await expect(badge(page, UNAVAILABLE_TITLE)).toHaveText('Doesn\'t ship to your region');

  // An item whose response omits coverage keeps its ordinary card.
  await expect(productCard(page, MISSING_TITLE)).toBeVisible();
  await expect(badge(page, MISSING_TITLE)).toHaveCount(0);
});

test('refetches the catalog badge after a Market change', async ({ page }) => {
  const listMarketCodes: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname.endsWith('/v1/products')) {
      listMarketCodes.push(request.headers()['x-market-code'] ?? '');
    }
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    markets: MARKETS,
    productsByMarket: {
      US: productsForMarket('US'),
      VN: productsForMarket('VN'),
    },
  });

  await page.goto('/search?q=ring&catalog_ship_to=all');
  await waitForHydration(page);

  await expect(badge(page, UNAVAILABLE_TITLE)).toBeVisible();
  await expect(badge(page, AVAILABLE_TITLE)).toHaveCount(0);

  await page.getByTestId('market-preferences-trigger').scrollIntoViewIfNeeded();
  await page.getByTestId('market-preferences-trigger').click();

  const dialog = page.locator('[data-testid="market-preferences-dialog"]').filter({
    has: page.getByText('Update your settings'),
  }).last();
  await expect(page.getByText('Update your settings')).toBeVisible();

  const regionField = dialog.getByLabel('Region');
  await regionField.click();
  await page.getByRole('option', { name: 'Vietnam', exact: true }).click();
  await expect(regionField).toContainText('Vietnam');

  await dialog.getByTestId('market-preferences-save').click();

  // The listing query is Market-sensitive: it must issue a VN request and the
  // badge must follow the new projection without an address or a reload.
  await expect.poll(() => listMarketCodes).toContain('VN');
  await expect(badge(page, AVAILABLE_TITLE)).toBeVisible();
  await expect(badge(page, UNAVAILABLE_TITLE)).toHaveCount(0);
});
