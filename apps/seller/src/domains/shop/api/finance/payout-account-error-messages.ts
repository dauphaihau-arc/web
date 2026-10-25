/** Seller-facing copy for Payout Account rejections; unknown codes retain the server message. */
export const PAYOUT_ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  PAYOUT_ACCOUNT_INVALID: 'Check the country, then try again.',
  PAYOUT_ACCOUNT_COUNTRY_UNSUPPORTED: 'Payouts are not available in that country yet. Choose another country or contact support.',
  PAYOUT_PROVIDER_NOT_CONFIGURED: 'Payouts are temporarily unavailable. Try again later, or contact support.',
};
