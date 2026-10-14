import { getPricePresetRanges } from '~/domains/product/ui/filters/product-filter.constants';

/**
 * Currency-scoped price preset options shared by the desktop filter panel and
 * the mobile filter sheet, so both render the same ranges and labels.
 */
export function usePricePresetOptions() {
  const marketStore = useMarketStore();

  const currency = computed(() => marketStore.guestPreferences?.currency ?? 'USD');

  const pricePresetOpts = computed(() => {
    const ranges = getPricePresetRanges(currency.value);

    return [
      { value: 'all', label: 'Any price' },
      ...ranges.map(range => ({
        value: range.value,
        label: range.min !== undefined && range.max !== undefined
          ? `${formatPriceValue(range.min)}-${formatPriceValue(range.max)}`
          : range.max !== undefined
            ? `Under ${formatPriceValue(range.max)}`
            : `Over ${formatPriceValue(range.min ?? 0)}`,
      })),
      { value: 'custom', label: 'Custom' },
    ];
  });

  return { currency, pricePresetOpts };
}

function formatPriceValue(amountMajor: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Number.isInteger(amountMajor) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(amountMajor) ? 0 : 2,
  }).format(amountMajor);
}
