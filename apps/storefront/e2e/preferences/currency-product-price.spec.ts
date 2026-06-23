import { expect, test } from '@playwright/test';
import { installStorefrontApiMocks } from '../support/network';

test('updates storefront product pricing after changing currency preferences', async ({ page }) => {
  await installStorefrontApiMocks(page, {
    currentUser: null,
  });

  await page.goto('/artisan-shop/handmade-ring');

  await expect(page.getByTestId('product-summary-price')).toContainText('$12.34');

  await page.getByTestId('market-preferences-trigger').scrollIntoViewIfNeeded();
  await page.getByTestId('market-preferences-trigger').click();

  await expect(page.getByText('Update your settings')).toBeVisible();
  const dialog = page.locator('[data-testid="market-preferences-dialog"]').filter({
    has: page.getByText('Update your settings'),
  }).last();

  const currencyField = dialog.getByLabel('Currency');
  await currencyField.click();
  await page.getByRole('option', { name: '€ Euro (EUR)' }).click();
  await expect(currencyField).toContainText('EUR');
  await dialog.getByTestId('market-preferences-save').click();

  await expect(page.getByTestId('product-summary-price')).toContainText('€11.00');
});
