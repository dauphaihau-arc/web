/** Seller-facing copy for manual withdrawal rejections; unknown codes retain the server message. */
export const MANUAL_PAYOUT_ERROR_MESSAGES: Record<string, string> = {
  MANUAL_PAYOUT_ALREADY_USED:
    'You have already made your manual withdrawal this month. Another one is available next month.',
  PAYOUT_PENDING:
    'An earlier payout is still pending. Wait for it to finish before withdrawing again.',
  PAYOUT_ACCOUNT_UNUSABLE:
    'Add a payout account, or wait for the one you added to be verified, before withdrawing.',
  PAYOUT_AMOUNT_EXCEEDS_AVAILABLE:
    'That is more than your available balance. Enter a smaller amount.',
  PAYOUT_AMOUNT_NOT_POSITIVE:
    'Enter an amount greater than zero in minor units.',
};
