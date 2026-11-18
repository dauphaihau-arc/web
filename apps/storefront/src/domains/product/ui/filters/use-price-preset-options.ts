import { getPricePresetRanges } from '~/domains/product/ui/filters/product-filter.constants';

/**
 * Currency-scoped price preset options shared by the desktop filter panel and
 * the mobile filter sheet, so both render the same ranges and labels. Labels
 * come from the active locale so the preset copy follows the browsing locale.
 */
export function usePricePresetOptions() {
  const marketStore = useMarketStore();
  const { t } = useI18n();

  const currency = computed(() => marketStore.guestPreferences?.currency ?? 'USD');

  const pricePresetOpts = computed(() => {
    const ranges = getPricePresetRanges(currency.value);

    return [
      { value: 'all', label: t('catalog.pricePresets.any') },
      ...ranges.map(range => ({
        value: range.value,
        label: range.min !== undefined && range.max !== undefined
          ? `${formatPriceValue(range.min)}-${formatPriceValue(range.max)}`
          : range.max !== undefined
            ? t('catalog.pricePresets.under', { amount: formatPriceValue(range.max) })
            : t('catalog.pricePresets.over', { amount: formatPriceValue(range.min ?? 0) }),
      })),
      { value: 'custom', label: t('catalog.pricePresets.custom') },
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
