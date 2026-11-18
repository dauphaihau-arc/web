const REGION_CODE: Record<string, string> = {
  'United States': 'US',
  Vietnam: 'VN',
};

export const DEFAULT_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

/**
 * Composes the full BCP-47 locale from the Storefront Language (URL locale) and
 * the Market region. Dates and numbers follow this locale; money does not — the
 * currency formatter keeps deciding grouping and symbols from the currency.
 */
export function resolveFormattingLocale(
  language: string | null | undefined,
  region: string | null | undefined,
): string {
  const baseLanguage = language?.trim().toLowerCase() || 'en';
  const regionCode = region ? REGION_CODE[region] : undefined;

  return regionCode ? `${baseLanguage}-${regionCode}` : baseLanguage;
}

export function formatLocaleDate(
  value: string | number | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_FORMAT_OPTIONS,
): string {
  if (value == null || value === '') {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatLocaleNumber(
  value: number | null | undefined,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || Number.isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat(locale, options).format(value);
}
