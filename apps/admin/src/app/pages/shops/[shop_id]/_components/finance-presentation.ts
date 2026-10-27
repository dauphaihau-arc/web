import dayjs from 'dayjs';
import type { AdminPayoutAccount } from '~/domains/finance/api/contracts/admin-finance.contract';
import type { FinanceStatusMeta } from '~/domains/finance/utils/finance-presentation';

/**
 * Page-local wording for the Payout fields the shared finance presentation does
 * not cover. Unknown server values keep their raw text.
 */
export const payoutSourceMeta: Record<string, FinanceStatusMeta> = {
  scheduled: { label: 'Scheduled', tone: 'gray' },
  manual: { label: 'Manual', tone: 'blue' },
};

const PAYOUT_REASON_LABELS: Record<string, string> = {
  no_payout_account: 'No payout account',
  payout_account_unverified: 'Account not verified',
  payout_account_disabled: 'Account disabled',
  payout_account_currency_mismatch: 'Account currency mismatch',
};

/** Why a Blocked or Failed Payout ended as it did, or null while it has none. */
export function payoutReasonLabel(reason: string | null) {
  if (!reason) {
    return null;
  }

  return PAYOUT_REASON_LABELS[reason] ?? reason;
}

const PAYOUT_ACCOUNT_PROVIDER_LABELS: Record<string, string> = {
  stripe_connect: 'Stripe Connect',
  manual_bank: 'Manual bank transfer',
};

export function payoutAccountProviderLabel(provider: string) {
  return PAYOUT_ACCOUNT_PROVIDER_LABELS[provider] ?? provider;
}

/** `Chase •••• 6789`, or whichever half the provider reported. */
export function formatPayoutAccountBankLine(account: AdminPayoutAccount): string | null {
  const number = account.last4 ? `•••• ${account.last4}` : null;

  if (account.bank_name && number) {
    return `${account.bank_name} ${number}`;
  }

  return account.bank_name ?? number;
}

export function formatFinanceDateTime(value?: string | null) {
  return value ? dayjs(value).format('MMM D, YYYY, h:mm A') : '—';
}

/** The shop's join date, e.g. `12 Mar 2024`; empty when the API sent none. */
export function formatShopJoinedDate(value?: string | null) {
  return value ? dayjs(value).format('D MMM YYYY') : '';
}

/** An ISO instant as the `datetime-local` input value, in the operator's local time. */
export function toDateTimeLocalValue(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DDTHH:mm') : '';
}
