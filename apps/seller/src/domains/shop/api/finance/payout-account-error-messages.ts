/** Seller-facing copy for Payout Account rejections; unknown codes retain the server message. */
export const PAYOUT_ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  PAYOUT_ACCOUNT_INVALID: 'Check the holder name, bank name, country and account reference, then try again.',
  PAYOUT_ACCOUNT_CURRENCY_MISMATCH: 'The shop Settlement Currency has changed. Add a Payout Account in the current currency.',
};
