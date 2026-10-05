import {
  PromotionBenefitType,
  PromotionMinOrderType,
} from '@arc/enums/promotion';
import { promoCodeVisibility } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

export { PROMO_CODE_CODE_MAX_LENGTH } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

/** The benefit shapes a Promo Code can be created with in this scope. */
export const PROMO_CODE_BENEFIT_OPTIONS = [
  { value: PromotionBenefitType.PERCENTAGE, label: 'Percentage off' },
  { value: PromotionBenefitType.FIXED_AMOUNT, label: 'Fixed amount off' },
  { value: PromotionBenefitType.FREE_SHIPPING, label: 'Free shipping' },
];

/** The mutually exclusive qualifying conditions a Promo Code can require. */
export const PROMO_CODE_MINIMUM_OPTIONS = [
  { value: PromotionMinOrderType.NONE, label: 'No minimum' },
  { value: PromotionMinOrderType.ORDER_TOTAL, label: 'Minimum spend' },
  { value: PromotionMinOrderType.PURCHASE_QUANTITY, label: 'Minimum quantity' },
];

/** The two Visibility options a Promo Code can be created with. */
export const PROMO_CODE_VISIBILITY_OPTIONS = [
  { value: promoCodeVisibility.PUBLIC, label: 'Show to shoppers' },
  { value: promoCodeVisibility.CODE_ONLY, label: 'Share via promo code' },
];
