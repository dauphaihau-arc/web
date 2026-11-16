import {
  expect, test, maskImages, openVisualPage, waitForVisualReady,
} from './support/visual';

test('cart with one item', async ({ page, appBaseURL }) => {
  await openVisualPage(page, appBaseURL, '/cart', {
    currentUser: null,
    cartQuantity: 1,
  });
  await waitForVisualReady(page, page.getByRole('heading', { name: '1 products in your cart' }));

  await expect(page).toHaveScreenshot('cart.png', {
    fullPage: true,
    mask: maskImages(page),
  });
});
