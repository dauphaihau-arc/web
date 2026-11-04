import type { components } from '@arc/schemas/api/generated/openapi';
import type { z } from 'zod';
import type {
  shopFinancePayoutAccountOnboardingResponseSchema,
  shopFinancePayoutAccountResponseSchema,
  shopFinancePayoutAccountSchema,
  startShopFinancePayoutAccountOnboardingRequestSchema,
} from '@arc/schemas/api/shop/finance/payout-account.schema';

/**
 * The generated `PayoutAccountResponseDto` and onboarding response type the
 * provider-owned fields (`provider_account_id`, `requirements`, `bank_name`,
 * `last4`, `url`, …) as `Record<string, unknown> | null`, which the app reads as
 * strings; those two shapes stay hand-written until the contract narrows them.
 * The onboarding request is also the runtime form schema, and the contract's
 * `StartPayoutOnboardingDto` types `country` as a plain string where the form
 * enforces a two-letter code.
 */
export type ShopFinancePayoutAccount = z.infer<typeof shopFinancePayoutAccountSchema>;
export type ShopFinancePayoutAccountResponse =
  z.infer<typeof shopFinancePayoutAccountResponseSchema>;
export type ShopFinancePayoutAccountCountries =
  components['schemas']['PayoutAccountCountriesResponseDto'];
export type StartShopFinancePayoutAccountOnboardingRequest = z.infer<
  typeof startShopFinancePayoutAccountOnboardingRequestSchema
>;
export type ShopFinancePayoutAccountOnboardingResponse =
  z.infer<typeof shopFinancePayoutAccountOnboardingResponseSchema>;
