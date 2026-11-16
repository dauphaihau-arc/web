import {
  expect, test, maskImages, openVisualPage, waitForVisualReady,
} from './support/visual';

test('product detail', async ({ page, appBaseURL }) => {
  await openVisualPage(page, appBaseURL, '/artisan-shop/handmade-ring', { currentUser: null });
  await waitForVisualReady(page, page.getByTestId('product-summary-price'));

  // Viewport, not full page: the sections below the fold (shipping, reviews,
  // recommendations) depend on endpoints the shared E2E mocks do not model and
  // would be captured as loading skeletons. Widen this once the fixtures answer
  // them.
  await expect(page).toHaveScreenshot('product-detail.png', {
    mask: maskImages(page),
  });
});
