import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useCheckoutSessionReadiness } from './use-checkout-session-readiness';
import { meCheckoutApi } from '../api/checkout/me-checkout.api';

vi.mock('../api/checkout/me-checkout.api', () => ({
  meCheckoutApi: {
    getCheckoutSessionReadiness: vi.fn(),
  },
}));

describe('useCheckoutSessionReadiness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('polls until the checkout session URL is ready', async () => {
    vi.mocked(meCheckoutApi.getCheckoutSessionReadiness)
      .mockResolvedValueOnce({
        checkout_pending: true,
        order_shops: [],
      })
      .mockResolvedValueOnce({
        checkout_pending: false,
        checkout_session_url: 'https://stripe.test/session-1',
        order_shops: [],
      });

    const waitForCheckoutSessionUrl = useCheckoutSessionReadiness();
    const result = waitForCheckoutSessionUrl(['order-1']);

    await vi.runOnlyPendingTimersAsync();

    await expect(result).resolves.toBe('https://stripe.test/session-1');
    expect(meCheckoutApi.getCheckoutSessionReadiness).toHaveBeenCalledTimes(2);
    expect(meCheckoutApi.getCheckoutSessionReadiness).toHaveBeenCalledWith(['order-1']);
  });

  it('fails when readiness never returns a checkout session URL', async () => {
    vi.mocked(meCheckoutApi.getCheckoutSessionReadiness).mockResolvedValue({
      checkout_pending: true,
      order_shops: [],
    });
    const waitForCheckoutSessionUrl = useCheckoutSessionReadiness();
    const result = waitForCheckoutSessionUrl(['order-1']);
    const assertion = expect(result).rejects.toThrow('Checkout session is still being prepared');

    await vi.runAllTimersAsync();
    await assertion;
  });
});
