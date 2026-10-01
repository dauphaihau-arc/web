import { PromotionProductScope } from '@arc/enums/promotion';

/** The two Product Scopes a Sale can be created with. */
export const SALE_PRODUCT_SCOPE_OPTIONS = [
  { value: PromotionProductScope.ALL, label: 'All products' },
  { value: PromotionProductScope.SPECIFIC, label: 'Select products' },
];

/** Whether the Sale starts immediately or at a chosen local time. */
export const SALE_START_MODE_OPTIONS = [
  { value: 'now', label: 'Start now' },
  { value: 'scheduled', label: 'Schedule for later' },
];

/**
 * A repeated local time resolves to two instants, so the seller has to say
 * which one the schedule means.
 */
export const SALE_OCCURRENCE_OPTIONS = [
  { value: 'earlier', label: 'Earlier occurrence (daylight time)' },
  { value: 'later', label: 'Later occurrence (standard time)' },
];
