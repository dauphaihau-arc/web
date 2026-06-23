import { expect, test } from '@playwright/test';
import { createUser } from '../support/factories';
import { installStorefrontApiMocks } from '../support/network';

test('logs in from the header dialog and unlocks the account page', async ({ page }) => {
  const user = createUser({
    display_name: 'Storefront E2E',
    email: 'storefront-e2e@example.com',
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    loginUser: user,
    cartQuantity: 1,
    cartQuantityAfterLogin: 2,
  });

  await page.goto('/guest-orders');

  await page.getByTestId('header-sign-in-trigger').click();
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  const loginDialog = page.getByRole('dialog');

  await loginDialog.locator('[name="email"]').fill(user.email);
  await loginDialog.locator('[name="password"]').fill('Valid1!Pass');
  await loginDialog.getByTestId('login-submit').click();

  await page.goto('/account');

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  await expect(page.getByText(user.display_name)).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
});

test('keeps the authenticated UI after a page refresh', async ({ page }) => {
  const user = createUser({
    display_name: 'Persistent Session',
    email: 'persistent-session@example.com',
  });

  await installStorefrontApiMocks(page, {
    currentUser: null,
    loginUser: user,
    cartQuantity: 0,
    cartQuantityAfterLogin: 2,
  });

  await page.goto('/guest-orders');

  const signInTrigger = page.getByTestId('header-sign-in-trigger');
  await expect(signInTrigger).toBeVisible();
  await signInTrigger.click();
  const loginDialog = page.getByRole('dialog');
  await loginDialog.locator('[name="email"]').fill(user.email);
  await loginDialog.locator('[name="password"]').fill('Valid1!Pass');
  await loginDialog.getByTestId('login-submit').click();

  await expect(page.getByTestId('header-sign-in-trigger')).toHaveCount(0);

  await page.reload();

  await expect(page.getByTestId('header-sign-in-trigger')).toHaveCount(0);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  await expect(page.getByText(user.display_name)).toBeVisible();
});
