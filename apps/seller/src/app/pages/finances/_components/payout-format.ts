import { formatMinorCurrency } from '@arc/utils';
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract';

/**
 * A payout converted into another currency shows both sides of the transfer:
 * what left the balance and what landed in the payout account. Same-currency
 * payouts keep the single amount, and payouts recorded before the frozen quote
 * have no target amount to show.
 */
type ForeignPayout = ShopFinancePayout & {
  [K in 'target_currency' | 'target_amount_minor']: NonNullable<ShopFinancePayout[K]>
};

export function isForeignPayout(payout: ShopFinancePayout): payout is ForeignPayout {
  return Boolean(payout.target_currency)
    && payout.target_currency !== payout.currency
    && payout.target_amount_minor !== null;
}

export function formatPayoutAmount(payout: ShopFinancePayout) {
  const paid = formatMinorCurrency(payout.amount_minor, payout.currency);

  if (!isForeignPayout(payout)) {
    return paid;
  }

  return `${paid} → ${formatMinorCurrency(payout.target_amount_minor, payout.target_currency)}`;
}

export function formatPayoutCurrency(payout: ShopFinancePayout) {
  if (!isForeignPayout(payout)) {
    return payout.currency;
  }

  return `${payout.currency} → ${payout.target_currency}`;
}

/**
 * The conversion rate to show for a payout. The provider reports the rate it
 * actually applied when the transfer settles; that is authoritative, so it
 * supersedes the claim-time estimate. Same-currency payouts have no rate.
 */
export function formatPayoutRate(payout: ShopFinancePayout): string | null {
  const sourceCurrency = payout.source_currency ?? payout.currency;
  const targetCurrency = payout.target_currency;

  if (!targetCurrency || targetCurrency === sourceCurrency) {
    return null;
  }

  const rate = payout.provider_fx_rate ?? payout.fx_rate;

  if (!rate) {
    return null;
  }

  return `1 ${sourceCurrency} = ${formatRate(rate)} ${targetCurrency}`;
}

/** Formats a decimal rate for display, leaving unparseable text as it arrived. */
export function formatRate(rate: string) {
  const value = Number(rate);

  if (!Number.isFinite(value)) {
    return rate;
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value);
}
