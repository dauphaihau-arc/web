import { useI18n } from 'vue-i18n';
import {
  DEFAULT_DATE_FORMAT_OPTIONS,
  formatLocaleDate,
  formatLocaleNumber,
  resolveFormattingLocale,
} from '~/shared/utils/locale-format';

/**
 * Formatting for buyer-facing dates and numbers. The locale is composed from
 * the Storefront Language (URL locale) and the Market region, so a Vietnamese
 * storefront in the US market formats `en-US` while one in Vietnam formats
 * `vi-VN`. Money keeps using the currency formatter and never follows this
 * locale.
 */
export function useLocaleFormatters() {
  const { locale } = useI18n();
  const marketStore = useMarketStore();

  const formattingLocale = computed(() => resolveFormattingLocale(
    locale.value,
    marketStore.activePreferences?.region ?? marketStore.guestPreferences?.region,
  ));

  function formatDate(
    value: string | number | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = DEFAULT_DATE_FORMAT_OPTIONS,
  ): string {
    return formatLocaleDate(value, formattingLocale.value, options);
  }

  function formatNumber(
    value: number | null | undefined,
    options?: Intl.NumberFormatOptions,
  ): string {
    return formatLocaleNumber(value, formattingLocale.value, options);
  }

  return {
    formattingLocale,
    formatDate,
    formatNumber,
  };
}
