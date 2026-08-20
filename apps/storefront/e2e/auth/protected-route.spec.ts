import { expect, test } from '@playwright/test';
import { installStorefrontApiMocks } from '../support/network';

test('redirects guests away from protected account pages @smoke', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
  });

  await page.goto('/account');

  await expect(page).toHaveURL(/\/$/);
});
