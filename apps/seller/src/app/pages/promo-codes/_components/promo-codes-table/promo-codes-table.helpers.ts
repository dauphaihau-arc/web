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

/**
 * The allowance consumed against the configured total. It is deliberately a
 * separate reading from the lifecycle Status column: an Active Promo Code may
 * be fully redeemed, and an Ended one keeps the count it consumed.
 *
 * An exhausted code shows only its Exhausted badge: the ratio is redundant once
 * the limit is reached, and a count past the limit would read as a bug. The
 * column header already says Redemptions, so the values carry no suffix.
 */
export function formatPromoAllowance(promoCode: ShopPromoCode): string {
  if (promoCode.exhausted) {
    return '';
  }

  return promoCode.max_redemptions == null
    ? `${promoCode.redemption_count}`
    : `${promoCode.redemption_count} / ${promoCode.max_redemptions}`;
}
