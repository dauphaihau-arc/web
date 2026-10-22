/**
 * One row of the shop's money timeline: Order income, a Refund, or a Payout.
 * Amounts are signed integer minor units of the shop's Settlement Currency and
 * satisfy `order_amount_minor + fees_minor = net_amount_minor`:
 * `order_amount_minor` is positive Order income and negative on Refunds,
 * `fees_minor` is negative on Order income and positive on Refunds (the fee
 * rebate), and `net_amount_minor` is what actually moves. Payout rows carry
 * only a negative `net_amount_minor`; the other two are null.
 */
export const shopFinanceTransactionTypes = [
  'order_income',
  'refund',
  'payout',
] as const;

export type ShopFinanceTransactionType = typeof shopFinanceTransactionTypes[number];

/**
 * `released`/`pending` belong to Order income, `deducted` to Refunds, and the
 * remaining values to Payouts. A partially released Order is `pending`.
 */
export const shopFinanceTransactionStatuses = [
  'released',
  'pending',
  'deducted',
  'paid',
  'blocked',
  'failed',
] as const;

export type ShopFinanceTransactionStatus = typeof shopFinanceTransactionStatuses[number];

export type ShopFinanceTransactionSource = 'scheduled' | 'manual';

export type ShopFinanceTransaction = {
  id?: string
  /** Newest-first sort key; ISO 8601 timestamp. */
  date: string
  /** Order public id for income and refund rows, Payout reference for payouts. */
  reference: string
  /** Seller-facing Order number for income and refund rows; null on payouts. */
  order_number?: string | null
  type: ShopFinanceTransactionType
  status: ShopFinanceTransactionStatus
  /** Positive Order income, negative Refund, null on Payouts. */
  order_amount_minor: number | null
  /** Negative fee on Order income, positive fee rebate on Refunds, null on Payouts. */
  fees_minor: number | null
  /** Order amount plus fees: positive income, negative Refund or Payout. */
  net_amount_minor: number
  currency: string
  /** Present on Payout rows: a scheduled run or a seller manual withdrawal. */
  source?: ShopFinanceTransactionSource | null
};

export type ListShopFinanceTransactionsRequest = {
  page?: number
  limit?: number
  type?: ShopFinanceTransactionType
  status?: ShopFinanceTransactionStatus
  /** Inclusive lower bound, ISO 8601 timestamp. */
  date_from?: string
  /** Inclusive upper bound, ISO 8601 timestamp. */
  date_to?: string
};

/** A numbered page of transactions, newest first. */
export type ShopFinanceTransactionsPage = {
  transactions: ShopFinanceTransaction[]
  total_results: number
  page: number
  limit: number
};
