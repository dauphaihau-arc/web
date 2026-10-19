import type {
  SaveShopFinancePayoutAccountRequestBody,
  ShopFinancePayoutAccountResponse,
} from './contracts/payout-account.contract';
import type { ShopFinancePayable } from './contracts/payable.contract';
import { apiClient } from '~/domains/_shared/api-client';

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
   * Saves the shop's Payout Account. The Settlement Currency is resolved by
   * the API and is never accepted from the client.
   */
  savePayoutAccount(shopId: string, body: SaveShopFinancePayoutAccountRequestBody) {
    return apiClient.put<ShopFinancePayoutAccountResponse>(
      `/shops/${shopId}/finance/payout-account`,
      body,
    );
  },
};
