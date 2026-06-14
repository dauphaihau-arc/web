import { toMinorUnits } from '@arc/utils';
import {
  getPricePresetRanges,
  isDigitalOpts,
  productWhoMadeOpts,
  type AttributeFilter,
  type PricePresetId,
  type ProductFilterState
} from '~/app/components/product/filters/product-filter.constants';

function parseQueryPriceValue(value: unknown) {
  return typeof value === 'string' && /^\d+$/.test(value) ?
    value :
    '';
}

function getPricePresetByBounds(minPrice: string, maxPrice: string, currency: string): PricePresetId {
  if (!minPrice && !maxPrice) {
    return 'all';
  }

  const presetRanges = getPricePresetRanges(currency);

  for (const range of presetRanges) {
    const normalizedMin = range.min !== undefined ?
      String(toMinorUnits(range.min, currency)) :
      '';
    const normalizedMax = range.max !== undefined ?
      String(toMinorUnits(range.max, currency)) :
      '';

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
    ...(range.min !== undefined ?
      {
        minPrice: String(toMinorUnits(range.min, currency) + (range.max === undefined ? 1 : 0)),
      } :
      {}),
    ...(range.max !== undefined ?
      {
        maxPrice: String(toMinorUnits(range.max, currency) - (range.min === undefined ? 1 : 0)),
      } :
      {}),
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

    const values = Array.isArray(rawValue) ?
      rawValue :
      typeof rawValue === 'string' ?
        [rawValue] :
        [];
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

export function createDefaultFilterState(routeQuery: Record<string, unknown>, currency: string): ProductFilterState {
  const base: ProductFilterState = {
    isDigital: 'all',
    price: 'all',
    minPrice: '',
    maxPrice: '',
    whoMade: 'all',
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
  currency: Ref<string>
) {
  const route = useRoute();
  const router = useRouter();

  const controlledQueryKeys = new Set<string>([
    'is_digital',
    'price',
    'min_price',
    'max_price',
    'who_made',
    'attribute_filters',
  ]);

  watch(state, () => {
    const routeQuery = Object.fromEntries(
      Object.entries(route.query).filter(([key]) => {
        return !/^attr_.+/.test(key) &&
          !controlledQueryKeys.has(key);
      })
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

      if (typeof value === 'string' && value !== 'all') {
        routeQuery[key] = value;
      }
    });

    router.push({ query: routeQuery });
  });
}
