import { expect, test } from '@playwright/test';
import { createUser } from '../support/factories';
import { installStorefrontApiMocks } from '../support/network';

/**
 * The accepted checkout quote for one shop: 100.00 regular merchandise, a 20%
 * Sale (already reflected in the priced subtotal), a 10% product Promo Code on
 * the Sale price, and a free-shipping waiver on a 5.00 Shipping Charge.
 */
const savingsQuote = {
  quote_id: 'quote-e2e-1',
  presentment_currency: 'USD',
  checkout_currency: 'USD',
  subtotal_minor: 8000,
  sale_discount_minor: 2000,
  discount_minor: 800,
  shipping_minor: 0,
  total_minor: 7200,
  expires_at: '2026-09-04T01:00:00.000Z',
  items: [],
  shops: [
    {
      shop_id: 'shop-e2e-1',
      shop_name: 'E2E Shop',
      shop_slug: 'e2e-shop',
      subtotal_minor: 8000,
      sale_discount_minor: 2000,
      discount_minor: 800,
      shipping_minor: 0,
      shipping_discount_minor: 500,
      total_minor: 7200,
      promo_codes: ['SAVE10', 'FREESHIP'],
      origin_countries: ['US'],
    },
  ],
};

const orderShop = {
  id: 'order-e2e-1',
  order_number: 'ORD-E2E-1',
  shop: { id: 'shop-e2e-1', shop_name: 'E2E Shop', slug: 'e2e-shop' },
  customer: { email: 'e2e@example.com' },
  payment: { type: 'card', card_brand: 'visa', card_last4: 4242 },
  status: 'paid',
  products: [
    {
      product: {
        id: 'product-e2e-1',
        slug: 'e2e-product',
        shop: { slug: 'e2e-shop' },
        selected_options: [],
        shipping: {},
      },
      inventory: { sku: 'SKU-1' },
      percent_coupon: null,
      id: 'item-e2e-1',
      title: 'E2E Product',
      quantity: 1,
      amount_minor: 8000,
      original_amount_minor: 10000,
      promo_discount_minor: 800,
      currency: 'USD',
    },
  ],
  promo_coupons: [
    { id: 'SAVE10', code: 'SAVE10' },
    { id: 'FREESHIP', code: 'FREESHIP' },
  ],
  fulfillment: {
    status: 'unfulfilled',
    requires_reconciliation: false,
    progress: {
      ordered: 1,
      prepared: 0,
      dispatched: 0,
      delivered: 0,
      canceled: 0,
      outstanding: 1,
    },
    groups: [],
    legacy_shipping: {
      status: 'pre_transit',
      updated_at: '2026-09-22T00:00:00.000Z',
      to_country: 'US',
      from_countries: ['US'],
      estimated_delivery: '2026-09-26T00:00:00.000Z',
    },
  },
  currency: 'USD',
  subtotal_minor: 8000,
  shipping_minor: 0,
  shipping_discount_minor: 500,
  discount_minor: 800,
  sale_discount_minor: 2000,
  total_minor: 7200,
  created_at: '2026-09-22T00:00:00.000Z',
  shipping_address: {
    full_name: 'E2E Buyer',
    address1: '123 Test St',
    city: 'Los Angeles',
    country: 'United States',
    state: 'California',
    zip: '90001',
    phone: '1234567890',
  },
};

test('checkout review explains regular value, Sale, Code and Shipping savings separately @smoke', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
    cartQuantity: 1,
    checkoutQuoteResponse: savingsQuote,
  });

  await page.goto('/checkout?c=cart-e2e-1');

  const summary = page.getByText('Summary Order', { exact: true });
  await expect(summary).toBeVisible();

  // Regular merchandise value (100.00), then each saving explained once.
  await expect(page.getByText('Product(s) total', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$100.00').first()).toBeVisible();
  await expect(page.getByText('Sale savings', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$20.00').first()).toBeVisible();
  await expect(page.getByText('Code savings', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$8.00').first()).toBeVisible();
  await expect(page.getByText('Shipping savings', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$5.00').first()).toBeVisible();
  // Subtotal after both savings is 72.00, the accepted total.
  await expect(page.getByText('$72.00').first()).toBeVisible();
});

test('a refused commitment for changed prices asks the buyer to review the refreshed total @smoke', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
    cartQuantity: 1,
    checkoutQuoteResponse: savingsQuote,
  });

  await page.route('**/me/checkout/buy-now', async (route) => {
    return route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'CHECKOUT_QUOTE_PRICES_CHANGED',
        message: 'Checkout totals changed',
        refreshed_totals: {
          checkout_currency: 'USD',
          subtotal_minor: 8000,
          shipping_minor: 0,
          discount_minor: 0,
          sale_discount_minor: 2000,
          total_minor: 8000,
          shops: [],
        },
      }),
    });
  });

  await page.goto('/checkout?c=cart-e2e-1');

  const completeOrder = page.getByRole('button', { name: 'Complete Order' });
  await expect(completeOrder).toBeEnabled();
  await completeOrder.click();

  await expect(page.getByText('Prices changed', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Review the new total and confirm your order again', { exact: false }),
  ).toBeVisible();
});

test('buyer Order details explain the same savings categories @smoke', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
  });

  await page.route('**/me/orders/order-e2e-1', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ order_shop: orderShop }),
    }));

  await page.goto('/orders/order-e2e-1');

  const showMore = page.getByRole('button', { name: 'Show more' });
  await expect(showMore).toBeVisible();
  await showMore.click();

  await expect(page.getByText('Sale savings', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Code savings', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Shipping savings', { exact: true }).first()).toBeVisible();
  // Regular 100.00 -> 20.00 Sale -> 8.00 Code -> 72.00 Subtotal, 0.00 Shipping.
  await expect(page.getByText('$100.00').first()).toBeVisible();
  await expect(page.getByText('$72.00').first()).toBeVisible();
});
