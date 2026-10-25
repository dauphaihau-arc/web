import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type {
  ShopFinancePayoutAccountCountries,
  ShopFinancePayoutAccountResponse,
  StartShopFinancePayoutAccountOnboardingRequest,
} from '~/domains/shop/api/finance/contracts/payout-account.contract';

export const SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY = 'shop-finance-payout-account';
export const SHOP_FINANCE_PAYOUT_ACCOUNT_COUNTRIES_QUERY_KEY =
  'shop-finance-payout-account-countries';

/**
 * The ops-owned Connect allowlist rarely changes, so it is cached for an hour:
 * every onboarding dialog can filter its picker without a fresh round trip.
 */
export function useShopFinancePayoutAccountCountries() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinancePayoutAccountCountries>({
    queryKey: [SHOP_FINANCE_PAYOUT_ACCOUNT_COUNTRIES_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.getPayoutAccountCountries(shopId);
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useShopFinancePayoutAccount() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinancePayoutAccountResponse>({
    queryKey: [SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.getPayoutAccount(shopId);
    },
  });
}

/**
 * Starts or resumes provider onboarding. The Payout Account is re-read
 * afterwards because onboarding may have changed its status without returning a
 * hosted URL, as the local adapter does.
 */
export function useStartShopFinancePayoutAccountOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-start-payout-account-onboarding'],
    mutationFn: async (body: StartShopFinancePayoutAccountOnboardingRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.startPayoutAccountOnboarding(shopId, body);
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: [SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY],
    }),
  });
}
