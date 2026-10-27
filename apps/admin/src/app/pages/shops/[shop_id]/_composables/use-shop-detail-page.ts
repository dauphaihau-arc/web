import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import type {
  AdminShopListEntry,
  ListAdminShopsParams,
} from '~/domains/shops/api/contracts/admin-shops.contract';
import { useAdminShops } from '~/domains/shops/queries/list.query';
import { useAdminShopPayable } from '~/domains/finance/queries/payable.query';
import { useAdminShopPayoutAccount } from '~/domains/finance/queries/payout-account.query';
import { useAdminShopPayouts } from '~/domains/finance/queries/payouts.query';

/**
 * The detail page has no shop-by-id endpoint, so the directory is searched by
 * the public id and the exact row is selected. A public id is unique, so a
 * single result page is enough.
 */
const SHOP_LOOKUP_LIMIT = 20;

export const SHOP_DETAIL_TABS = {
  overview: 0,
  commissionSchedule: 1,
  payoutHistory: 2,
} as const;

function isMissingPermissions(error: unknown) {
  return getStatusCode(error) === 403
    && readApiError(error).code === 'MISSING_REQUIRED_PERMISSIONS';
}

/**
 * One page-level answer for an operator who lacks `finance.manage` or follows a
 * stale shop id, rather than three card-level errors. Each finance query is
 * enabled only while its tab is open, so the page never loads the whole finance
 * surface at once.
 */
export function useShopDetailPage(shopId: MaybeRefOrGetter<string>) {
  const resolvedShopId = computed(() => toValue(shopId));
  const activeTab = ref<number>(SHOP_DETAIL_TABS.overview);

  const shopQuery = useAdminShops(computed<ListAdminShopsParams>(() => ({
    page: 1,
    limit: SHOP_LOOKUP_LIMIT,
    ...(resolvedShopId.value ? { search: resolvedShopId.value } : {}),
  })));

  const shop = computed<AdminShopListEntry | null>(() =>
    (shopQuery.data.value?.results ?? []).find(entry => entry.id === resolvedShopId.value) ?? null,
  );

  function financeShopIdForTab(tab: number) {
    return computed(() =>
      shop.value && activeTab.value === tab ? resolvedShopId.value : undefined,
    );
  }

  const payableQuery = useAdminShopPayable(financeShopIdForTab(SHOP_DETAIL_TABS.overview));
  const payoutAccountQuery = useAdminShopPayoutAccount(financeShopIdForTab(SHOP_DETAIL_TABS.overview));
  const payoutsQuery = useAdminShopPayouts(financeShopIdForTab(SHOP_DETAIL_TABS.payoutHistory));
  const financeQueries = [payableQuery, payoutAccountQuery, payoutsQuery];

  const isShopPermissionDenied = computed(() =>
    shopQuery.isError.value && isMissingPermissions(shopQuery.error.value),
  );

  const isFinancePermissionDenied = computed(() => financeQueries.some(query =>
    query.isError.value && isMissingPermissions(query.error.value),
  ));

  const isPermissionDenied = computed(() =>
    isShopPermissionDenied.value || isFinancePermissionDenied.value,
  );

  const isNotFound = computed(() => {
    if (isPermissionDenied.value) {
      return false;
    }

    if (shopQuery.isError.value) {
      return getStatusCode(shopQuery.error.value) === 404;
    }

    if (!shopQuery.isPending.value && !shop.value) {
      return true;
    }

    return financeQueries.some(query =>
      query.isError.value && getStatusCode(query.error.value) === 404,
    );
  });

  function retry() {
    void shopQuery.refetch();
  }

  return {
    shop,
    shopQuery,
    activeTab,
    isShopPermissionDenied,
    isFinancePermissionDenied,
    isNotFound,
    retry,
  };
}
