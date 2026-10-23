import type { ShopFinanceSettlementCurrencyBlockedReason } from './contracts/settlement-currency.contract';

/**
 * Seller-facing copy for Shop Currency change rejections; unknown codes
 * retain the server message.
 */
export const SETTLEMENT_CURRENCY_ERROR_MESSAGES: Record<string, string> = {
  SETTLEMENT_CURRENCY_BALANCE_NOT_ZERO:
    'Your balance must be zero before you can change your shop currency. Nothing is converted.',
  SETTLEMENT_CURRENCY_PAYOUT_PENDING:
    'A payout is still pending. Wait for it to finish, then change your shop currency.',
  SETTLEMENT_CURRENCY_CHANGE_TOO_SOON:
    'You can change your shop currency once every 90 days. Try again after the date shown.',
  SETTLEMENT_CURRENCY_UNSUPPORTED:
    'Choose a currency the marketplace accepts.',
  SETTLEMENT_CURRENCY_UNCHANGED:
    'Your shop already uses that currency.',
  SETTLEMENT_CURRENCY_RATE_UNAVAILABLE:
    'Exchange rates are unavailable right now. Try again later.',
};

/** Rejection copy the settings row and dialog share, keyed by the server's reason. */
const SETTLEMENT_CURRENCY_BLOCKED_REASON_MESSAGES: Record<
  Exclude<ShopFinanceSettlementCurrencyBlockedReason, 'change_too_soon'>,
  string
> = {
  balance_not_zero:
    'Your balance must be zero before you can change your shop currency.',
  payout_pending:
    'A payout is still pending. Wait for it to finish, then change your shop currency.',
};

export function formatSettlementCurrencyDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
    .format(new Date(value));
}

/** The "next change: <date>" helper, or null when no date has been set. */
export function settlementCurrencyNextChangeMessage(
  nextChangeAllowedAt: string | null | undefined,
): string | null {
  return nextChangeAllowedAt
    ? `Next change: ${formatSettlementCurrencyDate(nextChangeAllowedAt)}`
    : null;
}

/** Why the change is blocked, or null when it is allowed. */
export function settlementCurrencyBlockedReasonMessage(
  reason: ShopFinanceSettlementCurrencyBlockedReason | null | undefined,
  nextChangeAllowedAt?: string | null,
): string | null {
  if (!reason) {
    return null;
  }

  if (reason === 'change_too_soon') {
    return settlementCurrencyNextChangeMessage(nextChangeAllowedAt) ??
      SETTLEMENT_CURRENCY_ERROR_MESSAGES.SETTLEMENT_CURRENCY_CHANGE_TOO_SOON!;
  }

  return SETTLEMENT_CURRENCY_BLOCKED_REASON_MESSAGES[reason];
}

/** Where the seller can go to resolve a blocked reason. */
export const SETTLEMENT_CURRENCY_BLOCKED_REASON_LINKS: Record<
  ShopFinanceSettlementCurrencyBlockedReason,
  { to: string, label: string } | null
> = {
  balance_not_zero: { to: '/finances', label: 'View balance' },
  payout_pending: { to: '/finances/payouts', label: 'View payouts' },
  change_too_soon: null,
};
