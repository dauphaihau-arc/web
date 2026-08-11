import type { Query, QueryClient } from '@tanstack/vue-query';
import {
  describe, expect, it, vi,
} from 'vitest';
import { invalidateMarketSensitiveQueries } from './market-sensitive-queries';

type CapturedInvalidationOptions = {
  refetchType?: string
  predicate?: (query: Query) => boolean
};

function queryWithKey(queryKey: unknown[]): Query {
  return { queryKey } as unknown as Query;
}

describe('invalidateMarketSensitiveQueries', () => {
  it('invalidates active storefront queries affected by market preferences', async () => {
    const queryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    } as unknown as QueryClient;

    await invalidateMarketSensitiveQueries(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);

    const [rawOptions] = vi.mocked(queryClient.invalidateQueries).mock.calls[0];
    const options = rawOptions as unknown as CapturedInvalidationOptions;

    expect(options.refetchType).toBe('active');
    expect(options.predicate?.(queryWithKey(['get-products']))).toBe(true);
    expect(options.predicate?.(queryWithKey(['get-detail-product-by-slug']))).toBe(true);
    expect(options.predicate?.(queryWithKey(['get-cart']))).toBe(true);
    expect(options.predicate?.(queryWithKey(['guest-checkout-session']))).toBe(true);
    expect(options.predicate?.(queryWithKey(['current-user']))).toBe(false);
  });
});
