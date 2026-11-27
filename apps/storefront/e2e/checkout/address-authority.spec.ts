import { expect, test } from '@playwright/test';
import { createUser } from '../support/factories';
import { installStorefrontApiMocks } from '../support/network';

const MARKETS = [
  {
    code: 'US',
    name: 'United States',
    preview_country_code: 'US',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD'],
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
    enabled: true,
  },
  {
    code: 'VN',
    name: 'Vietnam',
    preview_country_code: 'VN',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD'],
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
    enabled: true,
  },
];

const QUOTE = {
  quote_id: 'quote-e2e-address',
  presentment_currency: 'USD',
  checkout_currency: 'USD',
  subtotal_minor: 1200,
  shipping_minor: 599,
  discount_minor: 0,
  sale_discount_minor: 0,
  total_minor: 1799,
  expires_at: '2026-12-01T00:00:00.000Z',
  items: [],
  shops: [
    {
      shop_id: 'shop-e2e-1',
      shop_name: 'E2E Shop',
      shop_slug: 'e2e-shop',
      subtotal_minor: 1200,
      shipping_minor: 599,
      shipping_discount_minor: 0,
      discount_minor: 0,
      sale_discount_minor: 0,
      total_minor: 1799,
      promo_codes: [],
      origin_countries: ['US'],
    },
  ],
};

const US_ADDRESS = {
  id: 'address-e2e-1',
  user: 'user-e2e-1',
  full_name: 'E2E Buyer',
  address_1: '123 Test St',
  city: 'Los Angeles',
  country: 'United States',
  country_code: 'US',
  state: 'California',
  zip: '90001',
  phone: '1234567890',
  is_primary: true,
  updated_at: '2026-09-04T00:00:00.000Z',
  created_at: '2026-09-04T00:00:00.000Z',
};

test('shows when shipping was recalculated for an address outside the preview region', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser({
      preferences: { currency: 'USD', language: 'en', region: 'Vietnam' },
    }),
    markets: MARKETS,
    userAddresses: [US_ADDRESS],
    checkoutQuoteResponse: QUOTE,
  });

  await page.goto('/checkout?c=cart-e2e-1');

  await expect(page.getByTestId('shipping-recalculated-note')).toHaveText(
    'Shipping was recalculated for United States; your preview region is Vietnam.',
  );
});

test('hides the recalculation note when the address matches the preview region', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
    markets: MARKETS,
    userAddresses: [US_ADDRESS],
    checkoutQuoteResponse: QUOTE,
  });

  await page.goto('/checkout?c=cart-e2e-1');

  await expect(page.getByText('Shipping address', { exact: true })).toBeVisible();
  await expect(page.getByTestId('shipping-recalculated-note')).toHaveCount(0);
});
