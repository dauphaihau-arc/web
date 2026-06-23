import { expect, test } from '@playwright/test';
import { installStorefrontApiMocks } from '../support/network';

test('redirects checkout visits that do not include a cart session query', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
  });

  await page.goto('/checkout');

  await expect(page).toHaveURL(/\/$/);
});
