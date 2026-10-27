import type {
  AdminCommissionSchedule,
  AdminShopCommissionScheduleResponse,
  AdminShopPayable,
  AdminShopPayoutAccountResponse,
  AdminShopPayoutsResponse,
  RecordCommissionScheduleBody,
} from './contracts/admin-finance.contract';
import { apiClient } from '~/domains/_shared/api-client';

const ADMIN_SHOPS = '/admin/shops';

/** The shop id is a public id (`shop_…`), so it is encoded like any path segment. */
function shopFinancePath(shopId: string, suffix: string) {
  return `${ADMIN_SHOPS}/${encodeURIComponent(shopId)}${suffix}`;
}

export const adminFinanceApi = {
  /**
   * The shop's Seller Payable in its Settlement Currency: what can be paid out
   * now and what is still held.
   */
  getPayable(shopId: string) {
    return apiClient.get<AdminShopPayable>(
      shopFinancePath(shopId, '/finance/payable'),
    );
  },

  /**
   * The shop's Payout history, newest first, including Blocked Payouts. The
   * endpoint wraps the rows; callers only ever want the list.
   */
  async getPayouts(shopId: string) {
    const response = await apiClient.get<AdminShopPayoutsResponse>(
      shopFinancePath(shopId, '/finance/payouts'),
    );

    return response.payouts;
  },

  /** The shop's Payout Account, or null when none is onboarded. */
  getPayoutAccount(shopId: string) {
    return apiClient.get<AdminShopPayoutAccountResponse>(
      shopFinancePath(shopId, '/finance/payout-account'),
    );
  },

  /**
   * The Commission Schedule in force now: the latest entry that has taken
   * effect, or null while the shop has none.
   */
  getCommissionSchedule(shopId: string) {
    return apiClient.get<AdminShopCommissionScheduleResponse>(
      shopFinancePath(shopId, '/commission-schedule'),
    );
  },

  /** Record or replace the shop's Commission Schedule from `effective_from`. */
  recordCommissionSchedule(shopId: string, body: RecordCommissionScheduleBody) {
    return apiClient.put<AdminCommissionSchedule>(
      shopFinancePath(shopId, '/commission-schedule'),
      body,
    );
  },
};
