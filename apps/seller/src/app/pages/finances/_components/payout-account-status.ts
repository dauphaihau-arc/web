import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';

type StatusColor = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

export interface PayoutAccountStatusMeta {
  label: string
  color: StatusColor
  description: string
}

/**
 * Seller-facing wording for each lifecycle status. The badge label is short
 * because it sits next to the card title; the description explains what the
 * status means without naming the provider.
 */
export const payoutAccountStatusMeta: Record<
  ShopFinancePayoutAccount['status'],
  PayoutAccountStatusMeta
> = {
  onboarding: {
    label: 'Onboarding',
    color: 'yellow',
    description: 'Stripe is setting up payouts for you. Finish setup to start receiving money.',
  },
  action_required: {
    label: 'Action required',
    color: 'yellow',
    description: 'Stripe needs a few more details before it can pay you.',
  },
  active: {
    label: 'Active',
    color: 'green',
    description: 'Ready to receive payouts.',
  },
  restricted: {
    label: 'Restricted',
    color: 'red',
    description: 'Payouts are limited while Stripe reviews this account.',
  },
  disabled: {
    label: 'Disabled',
    color: 'gray',
    description: 'Payouts are turned off for this account.',
  },
};

/**
 * Requirement keys are API paths such as `individual.verification.document`.
 * They are grouped by their leading segment so a new key from the provider
 * still produces a sentence instead of leaking the raw path to the seller.
 */
const requirementGroups: Array<[prefix: string, text: string]> = [
  ['external_account', 'your bank account details'],
  ['individual.verification', 'a photo ID to verify your identity'],
  ['individual.address', 'your home address'],
  ['individual.id_number', 'your ID number'],
  ['individual.ssn_last_4', 'the last four digits of your SSN'],
  ['individual.dob', 'your date of birth'],
  ['individual', 'your personal details'],
  ['business_profile', 'your business details'],
  ['company', 'your company details'],
  ['representative', 'details about your business representative'],
  ['owners', 'details about the business owners'],
  ['documents', 'supporting documents'],
  ['tos_acceptance', 'acceptance of the payout terms'],
];

function requirementText(requirement: string): string {
  const group = requirementGroups.find(([prefix]) => requirement.startsWith(prefix));

  if (group) {
    return group[1];
  }

  return requirement.replaceAll(/[._]/g, ' ');
}

/** What the provider still needs, deduplicated and in plain words. */
export function payoutAccountRequirementTexts(
  account: ShopFinancePayoutAccount,
): string[] {
  const due = account.requirements?.currently_due ?? [];

  return [...new Set(due.map(requirementText))];
}

const disabledReasonTexts: Record<string, string> = {
  'requirements.past_due': 'Some of your details are overdue.',
  'requirements.pending_verification': 'Stripe is still checking your details.',
  under_review: 'Stripe is reviewing this account.',
  'rejected.fraud': 'Stripe could not approve payouts for this account.',
  'rejected.listed': 'Stripe could not approve payouts for this account.',
  'rejected.other': 'Stripe could not approve payouts for this account.',
  'rejected.terms_of_service': 'Stripe could not approve payouts for this account.',
  listed: 'This account cannot receive payouts.',
  platform_paused: 'Payouts are paused for this account.',
  other: 'Stripe needs more information before it can pay you.',
};

/** The provider's disabled reason in plain words, or null when there is none. */
export function payoutAccountDisabledReasonText(
  account: ShopFinancePayoutAccount,
): string | null {
  const reason = account.requirements?.disabled_reason;

  if (!reason) {
    return null;
  }

  return disabledReasonTexts[reason] ?? 'Stripe has paused payouts for this account.';
}
