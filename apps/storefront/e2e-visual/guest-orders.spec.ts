import {
  expect, test, maskImages, openVisualPage, waitForVisualReady,
} from './support/visual';

test('guest order lookup', async ({ page, appBaseURL }) => {
  await openVisualPage(page, appBaseURL, '/guest-orders', { currentUser: null });
  await waitForVisualReady(page, page.getByRole('heading', { name: 'Track your guest order' }));

  await expect(page).toHaveScreenshot('guest-orders.png', {
    fullPage: true,
    mask: maskImages(page),
  });
});
