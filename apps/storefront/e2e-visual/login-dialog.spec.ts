import {
  expect, test, openVisualPage, waitForVisualReady,
} from './support/visual';

test('login dialog', async ({ page, appBaseURL }) => {
  await openVisualPage(page, appBaseURL, '/guest-orders', { currentUser: null });
  await waitForVisualReady(page, page.getByRole('heading', { name: 'Track your guest order' }));

  await page.getByTestId('header-sign-in-trigger').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  // Viewport rather than full page: the dialog is centered over the page, and a
  // full-page capture would fail on any content shift behind the overlay that
  // the dialog itself does not cause.
  await expect(page).toHaveScreenshot('login-dialog.png');
});
