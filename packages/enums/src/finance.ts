/**
 * What triggered a Payout: the shop's automatic schedule (`scheduled`) or a
 * seller-requested withdrawal (`manual`).
 */
export enum ShopPayoutSources {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

/**
 * The kind of money movement a shop transaction records. Income and Refunds
 * reference an Order; Label charges and Label refunds reference a carrier label;
 * Payouts move the net balance to the Payout Account.
 */
export enum ShopTransactionTypes {
  ORDER_INCOME = 'order_income',
  REFUND = 'refund',
  LABEL_CHARGE = 'label_charge',
  LABEL_REFUND = 'label_refund',
  PAYOUT = 'payout',
}

/**
 * Settlement state of the Payout attributed to one Order: `pending` while the
 * claim is not yet paid out, `paid` once the provider accepts the transfer.
 * This is narrower than a Payout row's own lifecycle.
 */
export enum OrderPayoutStates {
  PENDING = 'pending',
  PAID = 'paid',
}

/** Lifecycle of a shop's Payout Account as the provider reports it. */
export enum PayoutAccountStatuses {
  ONBOARDING = 'onboarding',
  ACTION_REQUIRED = 'action_required',
  ACTIVE = 'active',
  RESTRICTED = 'restricted',
  DISABLED = 'disabled',
}

/**
 * Where an Order's money would go. Adds `missing` to the Payout Account
 * lifecycle for a shop that has no usable account yet.
 */
export enum OrderPayoutMethodAccountStatuses {
  MISSING = 'missing',
  ONBOARDING = 'onboarding',
  ACTION_REQUIRED = 'action_required',
  ACTIVE = 'active',
  RESTRICTED = 'restricted',
  DISABLED = 'disabled',
}
