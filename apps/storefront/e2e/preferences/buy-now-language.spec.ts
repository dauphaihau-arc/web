import { expect, test } from '@playwright/test';
import { installStorefrontApiMocks } from '../support/network';
import { waitForHydration } from '../support/hydration';

test('buy now from a Vietnamese product page stays in Vietnamese checkout', async ({ page }) => {
  await installStorefrontApiMocks(page, { currentUser: null });

  await page.goto('/vi/artisan-shop/handmade-ring');
  await waitForHydration(page);

  await page.getByRole('button', { name: 'Mua ngay' }).click();

  await expect(page).toHaveURL(/\/vi\/checkout\?c=/);
});
