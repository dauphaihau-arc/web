import { toMinorUnits } from '@arc/utils';
import { PRODUCT_FILTER_QUERY_KEYS } from '~/domains/product/ui/filters/product-filter-query';
import { DEFAULT_PRODUCT_SORT_ID, type ProductSortId } from '~/domains/product/ui/filters/product-sort';
import {
  getPricePresetRanges,
  isDigitalOpts,
  productWhoMadeOpts,
  type AttributeFilter,
  type PricePresetId,
  type ProductFilterState,
} from '~/domains/product/ui/filters/product-filter.constants';

function parseQueryPriceValue(value: unknown) {
  return typeof value === 'string' && /^\d+$/.test(value)
    ? value
    : '';
}

function getPricePresetByBounds(minPrice: string, maxPrice: string, currency: string): PricePresetId {
  if (!minPrice && !maxPrice) {
    return 'all';
  }

  const presetRanges = getPricePresetRanges(currency);

  for (const range of presetRanges) {
    const normalizedMin = range.min !== undefined
      ? String(toMinorUnits(range.min, currency))
      : '';
    const normalizedMax = range.max !== undefined
      ? String(toMinorUnits(range.max, currency))
      : '';

    if (minPrice === normalizedMin && maxPrice === normalizedMax) {
      return range.value;
    }

    if (!normalizedMin && normalizedMax) {
      const exclusiveUpperBound = String(Math.max(0, Number(normalizedMax) - 1));

      if (!minPrice && maxPrice === exclusiveUpperBound) {
        return range.value;
      }
    }

    if (normalizedMin && !normalizedMax) {
      const exclusiveLowerBound = String(Number(normalizedMin) + 1);

      if (minPrice === exclusiveLowerBound && !maxPrice) {
        return range.value;
      }
    }
  }

  return 'custom';
}

type QueryPriceBounds = { minPrice?: string, maxPrice?: string };

function getPresetBounds(preset: PricePresetId, currency: string): QueryPriceBounds {
  const range = getPricePresetRanges(currency).find(item => item.value === preset);

  if (!range) {
    return {};
  }

  return {
    ...(range.min !== undefined
      ? {
        minPrice: String(toMinorUnits(range.min, currency) + (range.max === undefined ? 1 : 0)),
      }
      : {}),
    ...(range.max !== undefined
      ? {
        maxPrice: String(toMinorUnits(range.max, currency) - (range.min === undefined ? 1 : 0)),
      }
      : {}),
  };
}

function majorPriceInputToMinor(value: string, currency: string) {
  if (!value.trim()) {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return String(toMinorUnits(amount, currency));
}

function parseAttributeFilters(query: Record<string, unknown>): AttributeFilter[] {
  return Object.entries(query).flatMap(([key, rawValue]) => {
    const match = /^attr_(.+)$/.exec(key);

    if (!match?.[1]) {
      return [];
    }

    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'string'
        ? [rawValue]
        : [];
    const selectedOptionIds = values
      .flatMap(value => value.split(','))
      .map(value => value.trim())
      .filter(Boolean);

    if (selectedOptionIds.length === 0) {
      return [];
    }

    return [{
      facetKey: match[1],
      attributeName: '',
      selectedOptionKeys: Array.from(new Set(selectedOptionIds)),
      selectedOptionValues: Array.from(new Set(selectedOptionIds)),
    }];
  });
}

function normalizeCatalogShipTo(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;

  if (typeof raw !== 'string') {
    return '';
  }

  const normalized = raw.trim();

  if (normalized.toLowerCase() === 'all') {
    return 'all';
  }

  // Unknown and malformed codes are the API's to reject; the UI only keeps a
  // shape it can display, so an invalid value falls back to the Market default.
  return /^[a-z]{2}$/i.test(normalized) ? normalized.toUpperCase() : '';
}

export function createDefaultFilterState(routeQuery: Record<string, unknown>, currency: string): ProductFilterState {
  const base: ProductFilterState = {
    isDigital: 'all',
    price: 'all',
    minPrice: '',
    maxPrice: '',
    whoMade: 'all',
    catalogShipTo: normalizeCatalogShipTo(routeQuery.catalog_ship_to),
    attributeFilters: parseAttributeFilters(routeQuery),
  };

  const isDigital = routeQuery.is_digital;
  if (isDigital) {
    const found = isDigitalOpts.find(item => item.value.toString() === isDigital);
    base.isDigital = found?.value || 'all';
  }

  const whoMade = routeQuery.who_made;
  if (whoMade) {
    const found = productWhoMadeOpts.find(item => item.value === whoMade);
    base.whoMade = found?.value || 'all';
  }

  const minPrice = parseQueryPriceValue(routeQuery.min_price);
  const maxPrice = parseQueryPriceValue(routeQuery.max_price);
  base.minPrice = minPrice;
  base.maxPrice = maxPrice;
  base.price = getPricePresetByBounds(minPrice, maxPrice, currency);

  return base;
}

export function useProductFilterQuerySync(
  state: ProductFilterState,
  currency: Ref<string>,
  options?: { sortOrder?: Ref<ProductSortId> },
) {
  const route = useRoute();
  const router = useRouter();

  const controlledQueryKeys = [
    ...PRODUCT_FILTER_QUERY_KEYS,
    'price',
    'attribute_filters',
    'order',
  ] as const;
  const queryKeyByStateKey: Partial<Record<keyof ProductFilterState, string>> = {
    isDigital: 'is_digital',
    whoMade: 'who_made',
  };

  // Browser back/forward can change the URL without going through `state`.
  // Mirror the URL destination back into the filter so the two never disagree.
  let syncingCatalogShipToFromRoute = false;

  watch(() => route.query.catalog_ship_to, (value) => {
    const next = normalizeCatalogShipTo(value);

    if (state.catalogShipTo === next) {
      return;
    }

    syncingCatalogShipToFromRoute = true;
    state.catalogShipTo = next;
    void nextTick(() => {
      syncingCatalogShipToFromRoute = false;
    });
  });

  // Filters and sort share one watcher so a single interaction (e.g. the mobile
  // sheet's Apply) pushes one history entry instead of one per changed group.
  watch([state, () => options?.sortOrder?.value], () => {
    if (syncingCatalogShipToFromRoute) {
      return;
    }

    const routeQuery = Object.fromEntries(
      Object.entries(route.query).filter(([key]) => {
        return !/^attr_.+/.test(key)
          && !(controlledQueryKeys as readonly string[]).includes(key);
      }),
    ) as Record<string, string>;

    Object.keys(state).forEach((key) => {
      const value = state[key as keyof ProductFilterState];

      if (key === 'attributeFilters') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((filter) => {
            if (!filter.facetKey || filter.selectedOptionKeys.length === 0) {
              return;
            }

            routeQuery[`attr_${filter.facetKey}`] = filter.selectedOptionKeys.join(',');
          });
        }
        return;
      }

      if (key === 'price') {
        const pricePreset = value as PricePresetId;

        if (pricePreset === 'custom') {
          const minPriceMinor = majorPriceInputToMinor(state.minPrice, currency.value);
          const maxPriceMinor = majorPriceInputToMinor(state.maxPrice, currency.value);

          if (minPriceMinor) {
            routeQuery.min_price = minPriceMinor;
          }

          if (maxPriceMinor) {
            routeQuery.max_price = maxPriceMinor;
          }

          return;
        }

        const presetBounds = getPresetBounds(pricePreset, currency.value);

        if (presetBounds.minPrice) {
          routeQuery.min_price = presetBounds.minPrice;
        }

        if (presetBounds.maxPrice) {
          routeQuery.max_price = presetBounds.maxPrice;
        }

        return;
      }

      if (key === 'minPrice' || key === 'maxPrice') {
        return;
      }

      if (key === 'catalogShipTo') {
        // Absence means "follow the current Market", so an implicit choice is
        // represented by removing the key rather than writing a default.
        if (typeof value === 'string' && value.length > 0) {
          routeQuery.catalog_ship_to = value;
        }

        return;
      }

      if (typeof value === 'string' && value !== 'all') {
        routeQuery[queryKeyByStateKey[key as keyof ProductFilterState] ?? key] = value;
      }
    });

    const sortId = options?.sortOrder?.value;

    if (sortId && sortId !== DEFAULT_PRODUCT_SORT_ID) {
      routeQuery.order = sortId;
    }

    router.push({ query: routeQuery });
  });
}
