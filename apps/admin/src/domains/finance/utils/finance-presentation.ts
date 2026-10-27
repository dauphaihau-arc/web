import { formatMinorCurrency } from '@arc/utils';

/** The badge tones the shared status badge understands. */
export type FinanceTone = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

export interface FinanceStatusMeta {
  label: string
  tone: FinanceTone
}

/**
 * An amount in integer minor units, in the currency the API named. The admin
 * finance reads always pair the two, so an amount is never rendered in the
 * wrong scale.
 */
export function formatFinanceAmount(amountMinor?: number, currency?: string) {
  return formatMinorCurrency(amountMinor, currency);
}

/**
 * Payout lifecycle wording. The API owns the set, so an unknown state keeps its
 * raw value rather than being hidden behind a guessed label.
 */
export const payoutStateMeta: Record<string, FinanceStatusMeta> = {
  pending: { label: 'Pending', tone: 'yellow' },
  paid: { label: 'Paid', tone: 'green' },
  blocked: { label: 'Blocked', tone: 'gray' },
  failed: { label: 'Failed', tone: 'red' },
};

export function payoutStateLabel(state: string) {
  return payoutStateMeta[state]?.label ?? state;
}

export function payoutStateTone(state: string): FinanceTone {
  return payoutStateMeta[state]?.tone ?? 'gray';
}

/**
 * Payout Account lifecycle wording, the same statuses the seller sees. Stripe
 * owns the transitions, so an unknown status keeps its raw value.
 */
export const payoutAccountStatusMeta: Record<string, FinanceStatusMeta> = {
  onboarding: { label: 'Onboarding', tone: 'yellow' },
  action_required: { label: 'Action required', tone: 'yellow' },
  active: { label: 'Active', tone: 'green' },
  restricted: { label: 'Restricted', tone: 'red' },
  disabled: { label: 'Disabled', tone: 'gray' },
};

export function payoutAccountStatusLabel(status: string) {
  return payoutAccountStatusMeta[status]?.label ?? status;
}

export function payoutAccountStatusTone(status: string): FinanceTone {
  return payoutAccountStatusMeta[status]?.tone ?? 'gray';
}

/**
 * A commission rate is stored in basis points; operators read it as a
 * percentage with the two decimals the API's integer precision can express.
 */
export function formatCommissionPercent(rateBasisPoints: number) {
  return `${(rateBasisPoints / 100).toFixed(2)}%`;
}

/**
 * Reads an operator-typed percentage into integer basis points, or null when it
 * cannot become one. Two decimals are the most the API can store, so extra
 * precision is rejected instead of silently rounded.
 */
export function parseCommissionPercentToBasisPoints(input: string): number | null {
  const normalized = input.trim().replace(/%$/, '').trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [whole = '0', fraction = ''] = normalized.split('.');
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  if (!Number.isSafeInteger(basisPoints) || basisPoints > 10_000) {
    return null;
  }

  return basisPoints;
}
