import { formatMinorCurrency } from '@arc/utils';
import { MANUAL_PAYOUT_ERROR_MESSAGES } from '~/domains/shop/api/finance/payout-error-messages';
import { useShopFinancePayoutQuote } from '~/domains/shop/queries/payout-quote.query';
import { readApiError } from '~/shared/lib/api-error';
import { formatRate } from '../payout-format';

type UseManualPayoutQuoteOptions = {
  /** The amount the seller has entered, in shop-currency minor units. */
  amountMinor: MaybeRefOrGetter<number>
  /** Whether that amount is complete enough to preview. */
  canPreview: MaybeRefOrGetter<boolean>
  /** The currency the balance is held in. */
  sourceCurrency: MaybeRefOrGetter<string>
  /** The currency the payout account settles in. */
  targetCurrency: MaybeRefOrGetter<string>
};

/** Stands in for a figure the server has not quoted yet. */
const QUOTE_PLACEHOLDER = '—';

/**
 * The server preview of one withdrawal. Only the server prices a payout, so
 * this composable asks for a quote of the amount the seller has settled on,
 * rather than on every keystroke, and exposes the quoted figures as labels.
 *
 * A converted payout always has a quote panel, so the panel itself is driven by
 * the currencies alone: the figures fall back to a placeholder while the amount
 * is unusable and the previous quote stays in place while the next one is
 * fetched. That keeps the dialog the same height as the seller types.
 *
 * The quote is always an estimate: the platform charges no conversion fee and
 * the provider sets the final rate and amount when it sends the transfer.
 * A payout into the balance currency is the identity, so there is nothing to
 * convert and nothing to price: the quote is neither requested nor shown.
 */
export function useManualPayoutQuote(options: UseManualPayoutQuoteOptions) {
  const sourceCurrency = computed(() => toValue(options.sourceCurrency));
  const targetCurrency = computed(() => toValue(options.targetCurrency));

  /**
   * Only a payout into another currency has a quote worth showing. Without
   * both currencies the target is unknown, so the server still decides.
   */
  const isCurrencyConversion = computed(() => {
    const source = sourceCurrency.value;
    const target = targetCurrency.value;

    return !source || !target || source !== target;
  });

  /** The amount the quote should preview right now, or 0 for no quote. */
  const previewAmountMinor = computed(() => {
    if (!isCurrencyConversion.value || !toValue(options.canPreview)) {
      return 0;
    }

    const amount = toValue(options.amountMinor);

    return Number.isFinite(amount) ? amount : 0;
  });

  const quoteAmountMinor = ref(previewAmountMinor.value);

  watchDebounced(
    previewAmountMinor,
    (value) => {
      quoteAmountMinor.value = value;
    },
    { debounce: 300, maxWait: 1_000 },
  );

  const {
    data: quoteResponse,
    isError: isQuoteError,
    error: quoteError,
    isFetching: isQuoteRequestFetching,
  } = useShopFinancePayoutQuote(quoteAmountMinor);

  /**
   * While the amount is unusable there is nothing to show, even though the
   * previous quote is still cached for the last priced amount.
   */
  const quote = computed(() => (
    previewAmountMinor.value > 0 ? quoteResponse.value ?? null : null
  ));
  /** A conversion payout always reserves the panel, quote or not. */
  const showQuotePanel = computed(() => isCurrencyConversion.value);
  const hasQuote = computed(() => Boolean(quote.value));
  const isConversionQuote = computed(() => (
    hasQuote.value && quote.value!.target_currency !== quote.value!.source_currency
  ));
  /**
   * The values on screen are stale from the moment the seller edits the amount:
   * the debounce has not fired yet, or the server is still pricing it.
   */
  const isQuoteFetching = computed(() => (
    showQuotePanel.value
    && previewAmountMinor.value > 0
    && (isQuoteRequestFetching.value || quoteAmountMinor.value !== previewAmountMinor.value)
  ));

  const quoteErrorText = computed(() => {
    if (!isCurrencyConversion.value || !isQuoteError.value) {
      return '';
    }

    const apiError = readApiError(quoteError.value);

    return (apiError.code ? MANUAL_PAYOUT_ERROR_MESSAGES[apiError.code] : undefined) ??
      apiError.message ??
      'Unable to preview this payout.';
  });

  const quotedPaidLabel = computed(() => (
    hasQuote.value
      ? formatMinorCurrency(quote.value!.source_amount_minor, quote.value!.source_currency)
      : QUOTE_PLACEHOLDER
  ));
  const quotedRateLabel = computed(() => (
    isConversionQuote.value
      ? `1 ${quote.value!.source_currency} = ${formatRate(quote.value!.fx_rate)} ${quote.value!.target_currency}`
      : QUOTE_PLACEHOLDER
  ));
  const quotedReceivedLabel = computed(() => (
    hasQuote.value
      ? formatMinorCurrency(quote.value!.target_amount_minor, quote.value!.target_currency)
      : QUOTE_PLACEHOLDER
  ));

  return {
    showQuotePanel,
    hasQuote,
    isConversionQuote,
    isQuoteFetching,
    quoteErrorText,
    quotedPaidLabel,
    quotedRateLabel,
    quotedReceivedLabel,
  };
}
