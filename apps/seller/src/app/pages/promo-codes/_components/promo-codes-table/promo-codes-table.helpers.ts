import { PromotionBenefitType, PromotionStatus } from '@arc/enums/promotion';
import { formatMinorCurrency, toMinorUnits } from '@arc/utils';
import type { ShopPromoCode } from '~/domains/shop/api/promo-code/contracts/promo-code.contract';

export type PromotionStatusTone = 'blue' | 'green' | 'gray' | 'red';

export const promoCodeStatusLabels: Record<PromotionStatus, string> = {
  [PromotionStatus.SCHEDULED]: 'Scheduled',
  [PromotionStatus.ACTIVE]: 'Active',
  [PromotionStatus.ENDED]: 'Ended',
  [PromotionStatus.CANCELLED]: 'Cancelled',
};

export const promoCodeStatusTones: Record<PromotionStatus, PromotionStatusTone> = {
  [PromotionStatus.SCHEDULED]: 'blue',
  [PromotionStatus.ACTIVE]: 'green',
  [PromotionStatus.ENDED]: 'gray',
  [PromotionStatus.CANCELLED]: 'red',
};

/** The seller-facing benefit: a percentage, a fixed amount in its currency, or free shipping. */
export function formatPromoBenefit(promoCode: ShopPromoCode): string {
  if (promoCode.benefit_type === PromotionBenefitType.FIXED_AMOUNT) {
    return formatMinorCurrency(
      toMinorUnits(promoCode.amount_off ?? 0, promoCode.currency),
      promoCode.currency,
    );
  }

  if (promoCode.benefit_type === PromotionBenefitType.FREE_SHIPPING) {
    return 'Free shipping';
  }

  return `${promoCode.percent_off}%`;
}
