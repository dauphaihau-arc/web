import type { FilterOption } from '~/shared/ui/data-filter/types';

export type CouponTypeFilter = 'promo_code' | 'sale';

export const couponTypeFilterOptions: FilterOption<CouponTypeFilter>[] = [
  { label: 'Promo code', value: 'promo_code' },
  { label: 'Sale', value: 'sale' },
];
