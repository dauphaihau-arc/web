/**
 * Flattens a Nuxt route query into the string / string-list shape the product
 * listing request accepts, dropping keys whose value is empty, repeated-empty,
 * or not a string (route query values arrive as `string | null | (string |
 * null)[]`).
 *
 * Listing pages keep their filters in the route query, so every request that
 * describes the current listing starts from this normalized map.
 */
export function normalizeRouteQuery(
  query: Record<string, unknown>,
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      normalized[key] = value;
      return;
    }

    if (Array.isArray(value)) {
      const entries = value.filter((entry): entry is string => typeof entry === 'string');

      if (entries.length > 0) {
        normalized[key] = entries;
      }
    }
  });

  return normalized;
}
