import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract';

/** Client-side filters for the payout history list. */
export type PayoutFilters = {
  states: ShopFinancePayout['state'][]
  sources: ShopFinancePayout['source'][]
};

export const EMPTY_PAYOUT_FILTERS: PayoutFilters = {
  states: [],
  sources: [],
};
