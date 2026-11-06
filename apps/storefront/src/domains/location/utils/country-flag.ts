/**
 * Derives the flag emoji for an ISO 3166-1 alpha-2 country code. Unknown or
 * malformed codes return undefined so callers can fall back to plain text.
 */
export function toCountryFlag(countryCode: string | undefined): string | undefined {
  const normalized = countryCode?.trim().toUpperCase();

  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) {
    return undefined;
  }

  return String.fromCodePoint(
    ...[...normalized].map(char => 0x1F1E6 + char.charCodeAt(0) - 65),
  );
}

/** Country option label with a slightly wider gap than a normal word space. */
export function toCountryOptionLabel(countryCode: string | undefined, name: string): string {
  const flag = toCountryFlag(countryCode);

  return flag ? `${flag}\u2002${name}` : name;
}
