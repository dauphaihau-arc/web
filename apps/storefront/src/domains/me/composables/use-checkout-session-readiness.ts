import { meCheckoutApi } from '../api/checkout/me-checkout.api';

const CHECKOUT_SESSION_POLL_INTERVAL_MS = 1_000;
const CHECKOUT_SESSION_POLL_TIMEOUT_MS = 30_000;

export function useCheckoutSessionReadiness() {
  return async function waitForCheckoutSessionUrl(orderIds: string[]) {
    const deadline = Date.now() + CHECKOUT_SESSION_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const result = await meCheckoutApi.getCheckoutSessionReadiness(orderIds);

      if (result.checkout_session_url) {
        return result.checkout_session_url;
      }

      if (!result.checkout_pending) {
        break;
      }

      const { promise, resolve } = Promise.withResolvers<undefined>();
      setTimeout(resolve, CHECKOUT_SESSION_POLL_INTERVAL_MS);
      await promise;
    }

    throw new Error('Checkout session is still being prepared');
  };
}
