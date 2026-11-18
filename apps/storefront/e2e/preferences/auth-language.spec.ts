import { expect, test } from '@playwright/test';
import { installStorefrontApiMocks } from '../support/network';

test('the sign-in dialog renders in Vietnamese on /vi', async ({ page }) => {
  await installStorefrontApiMocks(page, { currentUser: null });

  await page.goto('/vi');
  await page.getByTestId('header-sign-in-trigger').click();

  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  await expect(page.getByText('Mới đến với Arc?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
});
