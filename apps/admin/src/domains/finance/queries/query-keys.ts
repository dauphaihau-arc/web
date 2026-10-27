/**
 * Every admin finance read is scoped to one shop, because the operator reaches
 * finance from an order's shop rather than a shop list. The commission schedule
 * key holds the schedule in force, which the record mutation invalidates so the
 * read reflects the rate that is actually effective afterwards.
 */
export const adminShopPayableKey = (shopId: string) =>
  ['admin-finance', 'payable', shopId] as const;

export const adminShopPayoutsKey = (shopId: string) =>
  ['admin-finance', 'payouts', shopId] as const;

export const adminShopPayoutAccountKey = (shopId: string) =>
  ['admin-finance', 'payout-account', shopId] as const;

export const adminShopCommissionScheduleKey = (shopId: string) =>
  ['admin-finance', 'commission-schedule', shopId] as const;
