import type { QueryClient } from '@tanstack/vue-query';

export const MARKET_SENSITIVE_QUERY_KEYS = new Set([
  'get-products',
  'get-detail-product-by-slug',
  'get-categories',
  'get-root-categories',
  'get-attributes-by-category',
  'get-cart',
  'guest-checkout-session',
]);

export function invalidateMarketSensitiveQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: query => MARKET_SENSITIVE_QUERY_KEYS.has(String(query.queryKey[0])),
    refetchType: 'active',
  });
}
