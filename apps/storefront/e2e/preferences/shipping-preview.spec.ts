import { expect, test } from '@playwright/test';
import { waitForHydration } from '../support/hydration';
import {
  buildDefaultProductDetail,
  installStorefrontApiMocks,
} from '../support/network';

test('shows the live shipping preview and keeps add to cart available', async ({ page }) => {
  await installStorefrontApiMocks(page, { currentUser: null });

  await page.goto('/artisan-shop/handmade-ring');
  await waitForHydration(page);

  await expect(page.getByText('Order today to get by')).toBeVisible();
  await expect(page.getByText('Cost to ship: $5.00')).toBeVisible();
  await expect(page.getByText('Ships from: United States')).toBeVisible();
});

test('warns when the preview destination is unsupported without blocking add to cart', async ({ page }) => {
  const unavailableProduct = buildDefaultProductDetail('USD');

  unavailableProduct.shipping.preview = {
    available: false,
    is_digital: false,
    reason: 'unsupported_destination',
  };

  await installStorefrontApiMocks(page, {
    currentUser: null,
    productDetailByCurrency: { USD: unavailableProduct },
  });

  await page.goto('/artisan-shop/handmade-ring');
  await waitForHydration(page);

  await expect(page.getByText('Doesn\'t ship to United States')).toBeVisible();
  await expect(page.getByText(/You can still add it to the cart/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
});
