import type { z } from 'zod';
import type {
  shopFinancePayoutAccountCountriesSchema,
  shopFinancePayoutAccountOnboardingResponseSchema,
  shopFinancePayoutAccountResponseSchema,
  shopFinancePayoutAccountSchema,
  startShopFinancePayoutAccountOnboardingRequestSchema,
} from '@arc/schemas/api/shop/finance/payout-account.schema';

export type ShopFinancePayoutAccount = z.infer<typeof shopFinancePayoutAccountSchema>;
export type ShopFinancePayoutAccountResponse = z.infer<typeof shopFinancePayoutAccountResponseSchema>;
export type ShopFinancePayoutAccountCountries = z.infer<
  typeof shopFinancePayoutAccountCountriesSchema
>;
export type StartShopFinancePayoutAccountOnboardingRequest = z.infer<
  typeof startShopFinancePayoutAccountOnboardingRequestSchema
>;
export type ShopFinancePayoutAccountOnboardingResponse = z.infer<
  typeof shopFinancePayoutAccountOnboardingResponseSchema
>;
