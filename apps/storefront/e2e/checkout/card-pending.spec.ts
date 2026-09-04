import { expect, test } from '@playwright/test';
import { createUser } from '../support/factories';
import { installStorefrontApiMocks } from '../support/network';

test('polls checkout readiness before redirecting a pending authenticated card checkout @smoke', async ({ page }) => {
  const checkoutUrl = 'https://checkout.stripe.com/e2e-session';
  const readinessRequests: string[] = [];

  await page.route('https://checkout.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Stripe Checkout</title><h1>Stripe Checkout</h1>',
    });
  });

  await installStorefrontApiMocks(page, {
    currentUser: createUser(),
    cartQuantity: 1,
    checkoutOrderResponse: {
      checkout_pending: true,
      order_shops: [
        {
          id: 'order-e2e-1',
          order_number: 'ORD-E2E-1',
          shop: {
            id: 'shop-e2e-1',
            shop_name: 'E2E Shop',
            slug: 'e2e-shop',
          },
        },
      ],
    },
    checkoutReadinessResponses: [
      {
        checkout_pending: true,
        order_shops: [],
      },
      {
        checkout_pending: false,
        checkout_session_url: checkoutUrl,
        order_shops: [],
      },
    ],
  });

  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/me/checkout/session/readiness')) {
      readinessRequests.push(request.url());
    }
  });

  await page.goto('/checkout?c=cart-e2e-1');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Complete Order' }).click();

  await expect(page).toHaveURL(checkoutUrl);
  expect(readinessRequests).toHaveLength(2);
  expect(readinessRequests[0]).toContain('order_ids=order-e2e-1');
});
