import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type {
  ListShopFinanceTransactionsRequest,
  ShopFinanceTransactionStatus,
  ShopFinanceTransactionType,
  ShopFinanceTransactionsPage,
} from '~/domains/shop/api/finance/contracts/transactions.contract';

export const SHOP_FINANCE_TRANSACTIONS_QUERY_KEY = 'shop-finance-transactions';

export const RECENT_TRANSACTIONS_LIMIT = 5;
export const TRANSACTIONS_PAGE_LIMIT = 20;

export type ShopFinanceTransactionFilters = {
  type?: ShopFinanceTransactionType
  status?: ShopFinanceTransactionStatus
  from?: string
  to?: string
};

function toStartOfDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
}

function toEndOfDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
}

function toRequest(
  filters: ShopFinanceTransactionFilters,
  page: number,
  limit: number,
): ListShopFinanceTransactionsRequest {
  return {
    page,
    limit,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.from ? { date_from: toStartOfDay(filters.from) } : {}),
    ...(filters.to ? { date_to: toEndOfDay(filters.to) } : {}),
  };
}

/** The latest transactions for the Overview card: no filters, no pagination. */
export function useShopFinanceRecentTransactions(limit = RECENT_TRANSACTIONS_LIMIT) {
  const queryClient = useQueryClient();

  return useQuery<ShopFinanceTransactionsPage>({
    queryKey: [SHOP_FINANCE_TRANSACTIONS_QUERY_KEY, 'recent', { limit }],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopFinanceApi.getTransactions(shopId, { limit });
    },
  });
}

/**
 * One numbered page of the Transactions list. Previous rows stay visible while
 * the next page loads or when that page fails, so the seller keeps context.
 */
export function useShopFinanceTransactions(
  filters?: MaybeRefOrGetter<ShopFinanceTransactionFilters>,
  page?: MaybeRefOrGetter<number>,
  limit = TRANSACTIONS_PAGE_LIMIT,
) {
  const queryClient = useQueryClient();
  const resolvedFilters = computed<ShopFinanceTransactionFilters>(() => toValue(filters) ?? {});
  const resolvedPage = computed(() => toValue(page) ?? 1);

  return useQuery<ShopFinanceTransactionsPage>({
    queryKey: computed(() => [
      SHOP_FINANCE_TRANSACTIONS_QUERY_KEY,
      'list',
      { ...resolvedFilters.value, page: resolvedPage.value, limit },
    ]),
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopFinanceApi.getTransactions(
        shopId,
        toRequest(resolvedFilters.value, resolvedPage.value, limit),
      );
    },
    placeholderData: keepPreviousData,
  });
}
