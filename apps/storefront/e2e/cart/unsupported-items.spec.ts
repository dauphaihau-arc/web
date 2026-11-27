import { expect, test } from '@playwright/test';
import { waitForHydration } from '../support/hydration';
import { installStorefrontApiMocks } from '../support/network';

const CART_RESPONSE = {
  cart: {
    id: 'cart-e2e-unsupported',
    user_id: 'user-e2e-1',
    is_temp: false,
    total_quantity: 2,
    recent_items: [],
    shop_groups: [
      {
        shop: { id: 'shop-e2e-1', name: 'E2E Shop' },
        currency: 'USD',
        total_minor: 1200,
        discount_minor: 0,
        sale_discount_minor: 0,
        shipping_minor: 0,
        items: [
          {
            id: 'cart-item-supported',
            quantity: 1,
            is_selected: true,
            unit_price_minor: 1200,
            product: {
              id: 'product-supported',
              title: 'Supported Mug',
              slug: 'supported-mug',
              shop: { slug: 'e2e-shop' },
              image_url: 'https://example.test/supported.png',
            },
            inventory: {
              id: 'inventory-supported',
              amount_minor: 1200,
              currency: 'USD',
              stock: 5,
              selected_options: [],
            },
            shipping: {
              available: true,
              is_digital: false,
            },
          },
          {
            id: 'cart-item-unsupported',
            quantity: 1,
            is_selected: true,
            unit_price_minor: 999,
            product: {
              id: 'product-unsupported',
              title: 'Unsupported Lamp',
              slug: 'unsupported-lamp',
              shop: { slug: 'e2e-shop' },
              image_url: 'https://example.test/unsupported.png',
            },
            inventory: {
              id: 'inventory-unsupported',
              amount_minor: 999,
              currency: 'USD',
              stock: 5,
              selected_options: [],
            },
            shipping: {
              available: false,
              is_digital: false,
              reason: 'unsupported_destination',
            },
          },
        ],
      },
    ],
  },
  cart_owner_type: 'guest',
  requires_sign_in_for_checkout: false,
  summary: {
    currency: 'USD',
    subtotal_minor: 1200,
    discount_minor: 0,
    subtotal_after_discount_minor: 1200,
    shipping_minor: 0,
    total_minor: 1200,
    total_selected_quantity: 2,
    total_quantity: 2,
    unavailable_quantity: 1,
  },
};

test('keeps an unsupported item selected, explains it, and blocks checkout', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
    cartResponse: CART_RESPONSE,
  });

  await page.goto('/cart');
  await waitForHydration(page);

  await expect(page.getByText('Unsupported Lamp')).toBeVisible();
  await expect(page.getByTestId('cart-item-shipping-warning')).toHaveCount(1);
  await expect(page.getByTestId('cart-item-shipping-warning')).toContainText(
    'Doesn\'t ship to your region',
  );
  await expect(page.getByTestId('cart-item-shipping-warning')).toContainText(
    'excluded from the total',
  );
  await expect(page.getByTestId('cart-unavailable-notice')).toContainText(
    '1 selected item cannot ship to your region',
  );
  await expect(page.getByRole('button', { name: 'Proceed to checkout' })).toBeDisabled();
});
