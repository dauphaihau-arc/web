import { PromotionProductScope } from '@arc/enums/promotion';
import { promoCodeVisibility } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

export { PROMO_CODE_CODE_MAX_LENGTH } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

/** The two Product Scopes a Promo Code can be created with. */
export const PROMO_CODE_PRODUCT_SCOPE_OPTIONS = [
  { value: PromotionProductScope.ALL, label: 'All products' },
  { value: PromotionProductScope.SPECIFIC, label: 'Select products' },
];

/** The two Visibility options a Promo Code can be created with. */
export const PROMO_CODE_VISIBILITY_OPTIONS = [
  { value: promoCodeVisibility.PUBLIC, label: 'Show to shoppers' },
  { value: promoCodeVisibility.CODE_ONLY, label: 'Share via promo code' },
];

/** Whether the Promo Code starts immediately or at a chosen local time. */
export const PROMO_CODE_START_MODE_OPTIONS = [
  { value: 'now', label: 'Start now' },
  { value: 'scheduled', label: 'Schedule for later' },
];
