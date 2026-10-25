import type {
  ShopFinancePayoutAccountCountries,
  ShopFinancePayoutAccountOnboardingResponse,
  ShopFinancePayoutAccountResponse,
  StartShopFinancePayoutAccountOnboardingRequest,
} from './contracts/payout-account.contract';
import type {
  RequestShopFinanceManualPayoutRequest,
  ShopFinanceManualPayoutResponse,
} from './contracts/manual-payout.contract';
import type { ShopFinancePayable } from './contracts/payable.contract';
import type {
  GetShopFinancePayoutQuoteRequest,
  ShopFinancePayoutHistory,
  ShopFinancePayoutQuote,
} from './contracts/payout.contract';
import type {
  ListShopFinanceTransactionsRequest,
  ShopFinanceTransactionsPage,
} from './contracts/transactions.contract';
import type {
  ShopFinancePayoutSettings,
  UpdateShopFinancePayoutSettingsRequest,
} from './contracts/payout-settings.contract';
import type {
  ChangeShopFinanceSettlementCurrencyRequest,
  ShopFinanceSettlementCurrency,
  ShopFinanceSettlementCurrencyChange,
} from './contracts/settlement-currency.contract';
import { apiClient } from '~/domains/_shared/api-client';

/**
 * A manual withdrawal moves money once, so a retried request must not pay the
 * seller twice. The API requires an idempotency key for it.
 */
function idempotentOptions() {
  return {
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
    },
  };
}

export const shopFinanceApi = {
  /**
   * The shop's Seller Payable, in its Settlement Currency: what can be paid out
   * now and what is still held. Amounts are integer minor units.
   */
  getPayable(shopId: string) {
    return apiClient.get<ShopFinancePayable>(
      `/shops/${shopId}/finance/payable`,
    );
  },
  /**
   * The shop's active Payout Account and what the payout provider reports about
   * it. Stripe holds the bank details; neither the API nor the seller app ever
   * sees them.
   */
  getPayoutAccount(shopId: string) {
    return apiClient.get<ShopFinancePayoutAccountResponse>(
      `/shops/${shopId}/finance/payout-account`,
    );
  },

  /**
   * The ops-owned list of countries where payout onboarding may start. The
   * picker offers exactly these, so an unsupported country is never chosen.
   */
  getPayoutAccountCountries(shopId: string) {
    return apiClient.get<ShopFinancePayoutAccountCountries>(
      `/shops/${shopId}/finance/payout-account/countries`,
    );
  },

  /**
   * Starts or resumes Stripe onboarding for the shop's Payout Account. The
   * response carries the hosted URL, or null for the local adapter, which
   * activates the destination without leaving the app. The request is
   * idempotent so a retry cannot create a second connected account.
   */
  startPayoutAccountOnboarding(
    shopId: string,
    body: StartShopFinancePayoutAccountOnboardingRequest,
  ) {
    return apiClient.post<ShopFinancePayoutAccountOnboardingResponse>(
      `/shops/${shopId}/finance/payout-account/onboarding`,
      body,
      idempotentOptions(),
    );
  },

  /**
   * The shop's Payouts, newest first. Amounts are integer minor units.
   */
  getPayouts(shopId: string) {
    return apiClient.get<ShopFinancePayoutHistory>(
      `/shops/${shopId}/finance/payouts`,
    );
  },

  /**
   * The shop's money timeline: Order income, Refunds, and Payouts merged newest
   * first. Amounts are signed integer minor units in the Settlement Currency.
   * Numbered pagination: pass `page` and `limit`.
   */
  getTransactions(shopId: string, query?: ListShopFinanceTransactionsRequest) {
    return apiClient.get<ShopFinanceTransactionsPage>(
      `/shops/${shopId}/finance/transactions`,
      query,
    );
  },

  /**
   * The server-computed preview of a withdrawal: fee, rate and the amount that
   * would land in the Payout Account. Nothing is persisted; the client never
   * converts between currencies itself.
   */
  getPayoutQuote(shopId: string, query: GetShopFinancePayoutQuoteRequest) {
    return apiClient.get<ShopFinancePayoutQuote>(
      `/shops/${shopId}/finance/payouts/quote`,
      query,
    );
  },

  /**
   * Whether auto payout is on, the day of the month it runs, and how many
   * manual withdrawals are left this platform month (null means unlimited).
   */
  getPayoutSettings(shopId: string) {
    return apiClient.get<ShopFinancePayoutSettings>(
      `/shops/${shopId}/finance/payout-settings`,
    );
  },

  /**
   * Turns auto payout on or off. The API answers with the settings it stored.
   */
  savePayoutSettings(shopId: string, body: UpdateShopFinancePayoutSettingsRequest) {
    return apiClient.put<ShopFinancePayoutSettings>(
      `/shops/${shopId}/finance/payout-settings`,
      body,
    );
  },

  /**
   * The shop's Settlement Currency, read from its dated history, and when it may
   * change again.
   */
  getSettlementCurrency(shopId: string) {
    return apiClient.get<ShopFinanceSettlementCurrency>(
      `/shops/${shopId}/finance/settlement-currency`,
    );
  },

  /**
   * Moves the shop to another currency at a zero balance. The API decides
   * whether the change is allowed and answers with the currency it stored. The
   * request is idempotent so a retry cannot write a second history row.
   */
  changeSettlementCurrency(
    shopId: string,
    body: ChangeShopFinanceSettlementCurrencyRequest,
  ) {
    return apiClient.post<ShopFinanceSettlementCurrencyChange>(
      `/shops/${shopId}/finance/settlement-currency`,
      body,
      idempotentOptions(),
    );
  },

  /**
   * Withdraws the whole net available balance, or `amount_minor` of it. The
   * request is idempotent so a retry cannot pay the seller twice.
   */
  requestManualPayout(shopId: string, body: RequestShopFinanceManualPayoutRequest) {
    return apiClient.post<ShopFinanceManualPayoutResponse>(
      `/shops/${shopId}/finance/payouts/manual`,
      body,
      idempotentOptions(),
    );
  },
};
