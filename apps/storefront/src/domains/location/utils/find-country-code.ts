import type { Country } from '~/domains/location/api/contracts/location.contract';

/**
 * Saved addresses still return the country as a display name while the
 * administrative-area endpoint is keyed by ISO code. Legacy rows may also hold
 * a bare code, so both vocabularies resolve here.
 */
export function findCountry(
  countries: Country[] | undefined,
  value: string | undefined,
): Country | undefined {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return countries?.find(country =>
    country.code.toLowerCase() === normalized
    || country.name.toLowerCase() === normalized,
  );
}

export function findCountryCode(
  countries: Country[] | undefined,
  value: string | undefined,
): string | undefined {
  return findCountry(countries, value)?.code;
}
