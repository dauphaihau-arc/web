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
};
