/**
 * Query keys that carry an active storefront product filter.
 *
 * The listing sends the whole route query; the facet panel must send the same
 * filter subset so facet alternatives honor the active selection. Attribute
 * selections use the stable `attr_<facetKey>` params; the remaining keys mirror
 * the public listing request shape. Keeping the table beside the filter UI
 * stops the listing and the facet panel from drifting apart.
 */
export const PRODUCT_FILTER_QUERY_KEYS = [
  'is_digital',
  'who_made',
  'min_price',
  'max_price',
] as const;

const ATTRIBUTE_FILTER_QUERY_PREFIX = 'attr_';

export function isAttributeFilterQueryKey(key: string): boolean {
  return key.startsWith(ATTRIBUTE_FILTER_QUERY_PREFIX);
}

export function isProductFilterQueryKey(key: string): boolean {
  return isAttributeFilterQueryKey(key)
    || (PRODUCT_FILTER_QUERY_KEYS as readonly string[]).includes(key);
}

function toQueryEntries(value: unknown): string | string[] | undefined {
  if (typeof value === 'string') {
    return value.length > 0 ? value : undefined;
  }

  if (Array.isArray(value)) {
    const entries = value.filter(
      (entry): entry is string => typeof entry === 'string' && entry.length > 0,
    );
    return entries.length > 0 ? entries : undefined;
  }

  return undefined;
}

/**
 * Extracts the active filter params from a route query, dropping empty values
 * and non-filter keys (`page`, `order`, ...) so facet alternatives stay
 * independent of pagination and sorting.
 */
export function extractProductFilterQuery(
  query: Record<string, unknown>,
): Record<string, string | string[]> {
  const filters: Record<string, string | string[]> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (!isProductFilterQueryKey(key)) {
      return;
    }

    const normalized = toQueryEntries(value);

    if (normalized !== undefined) {
      filters[key] = normalized;
    }
  });

  return filters;
}

/**
 * Builds the category-only facet request: the eligible products' facets before
 * any shopper filter narrows them. The panel uses it as the baseline option
 * list so an unavailable option stays visible (rendered disabled) instead of
 * disappearing. It shares the facet query cache with the filtered request, but
 * carries no filter params, so a previously visited filter state can never
 * stand in for the baseline.
 */
export function buildFacetBaselineQuery(
  categoryId: string,
): Record<string, string> {
  return { category_id: categoryId };
}

/**
 * Builds the facet request params: the active filter subset plus the resolved
 * category identity. The backend then computes each facet's alternatives with
 * every active filter except that facet's own.
 */
export function buildFacetRequestQuery(
  categoryId: string,
  query: Record<string, unknown>,
): Record<string, string | string[]> {
  return {
    ...extractProductFilterQuery(query),
    category_id: categoryId,
  };
}
