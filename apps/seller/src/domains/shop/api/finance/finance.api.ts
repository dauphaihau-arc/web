import type {
  SaveShopFinancePayoutAccountRequestBody,
  ShopFinancePayoutAccountResponse,
} from './contracts/payout-account.contract';
import type {
  RequestShopFinanceManualPayoutRequest,
  ShopFinanceManualPayoutResponse,
} from './contracts/manual-payout.contract';
import type { ShopFinancePayable } from './contracts/payable.contract';
import type { ShopFinancePayoutHistory } from './contracts/payout.contract';
import type {
  ShopFinancePayoutSettings,
  UpdateShopFinancePayoutSettingsRequest,
} from './contracts/payout-settings.contract';
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
   * The shop's active Payout Account, with the account reference masked.
   */
  getPayoutAccount(shopId: string) {
    return apiClient.get<ShopFinancePayoutAccountResponse>(
      `/shops/${shopId}/finance/payout-account`,
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
   * Saves the shop's Payout Account. The Settlement Currency is resolved by
   * the API and is never accepted from the client.
   */
  savePayoutAccount(shopId: string, body: SaveShopFinancePayoutAccountRequestBody) {
    return apiClient.put<ShopFinancePayoutAccountResponse>(
      `/shops/${shopId}/finance/payout-account`,
      body,
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
