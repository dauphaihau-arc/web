import { toMinorUnits } from '@arc/utils'
import {
  getPricePresetRanges,
  isDigitalOpts,
  productWhoMadeOpts,
  type AttributeFilter,
  type PricePresetId,
  type ProductFilterState,
} from '~/app/components/product/filters/product-filter.constants'

function parseQueryPriceValue(value: unknown) {
  return typeof value === 'string' && /^\d+$/.test(value)
    ? value
    : ''
}

function getPricePresetByBounds(minPrice: string, maxPrice: string, currency: string): PricePresetId {
  if (!minPrice && !maxPrice) {
    return 'all'
  }

  const presetRanges = getPricePresetRanges(currency)

  for (const range of presetRanges) {
    const normalizedMin = range.min !== undefined
      ? String(toMinorUnits(range.min, currency))
      : ''
    const normalizedMax = range.max !== undefined
      ? String(toMinorUnits(range.max, currency))
      : ''

    if (minPrice === normalizedMin && maxPrice === normalizedMax) {
      return range.value
    }

    if (!normalizedMin && normalizedMax) {
      const exclusiveUpperBound = String(Math.max(0, Number(normalizedMax) - 1))

      if (!minPrice && maxPrice === exclusiveUpperBound) {
        return range.value
      }
    }

    if (normalizedMin && !normalizedMax) {
      const exclusiveLowerBound = String(Number(normalizedMin) + 1)

      if (minPrice === exclusiveLowerBound && !maxPrice) {
        return range.value
      }
    }
  }

  return 'custom'
}

type QueryPriceBounds = { min_price?: string, max_price?: string }

function getPresetBounds(preset: PricePresetId, currency: string): QueryPriceBounds {
  const range = getPricePresetRanges(currency).find(item => item.value === preset)

  if (!range) {
    return {}
  }

  return {
    ...(range.min !== undefined
      ? {
          min_price: String(toMinorUnits(range.min, currency) + (range.max === undefined ? 1 : 0)),
        }
      : {}),
    ...(range.max !== undefined
      ? {
          max_price: String(toMinorUnits(range.max, currency) - (range.min === undefined ? 1 : 0)),
        }
      : {}),
  }
}

function majorPriceInputToMinor(value: string, currency: string) {
  if (!value.trim()) {
    return undefined
  }

  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined
  }

  return String(toMinorUnits(amount, currency))
}

function parseAttributeFilters(query: Record<string, unknown>): AttributeFilter[] {
  return Object.entries(query).flatMap(([key, rawValue]) => {
    const match = /^attr_(.+)$/.exec(key)

    if (!match?.[1]) {
      return []
    }

    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'string'
        ? [rawValue]
        : []
    const selectedOptionIds = values
      .flatMap(value => value.split(','))
      .map(value => value.trim())
      .filter(Boolean)

    if (selectedOptionIds.length === 0) {
      return []
    }

    return [{
      facet_key: match[1],
      attribute_name: '',
      selected_option_keys: Array.from(new Set(selectedOptionIds)),
      selected_option_values: Array.from(new Set(selectedOptionIds)),
    }]
  })
}

export function createDefaultFilterState(routeQuery: Record<string, unknown>, currency: string): ProductFilterState {
  const base: ProductFilterState = {
    is_digital: 'all',
    price: 'all',
    min_price: '',
    max_price: '',
    who_made: 'all',
    attribute_filters: parseAttributeFilters(routeQuery),
  }

  const isDigital = routeQuery.is_digital
  if (isDigital) {
    const found = isDigitalOpts.find(item => item.value.toString() === isDigital)
    base.is_digital = found?.value || 'all'
  }

  const whoMade = routeQuery.who_made
  if (whoMade) {
    const found = productWhoMadeOpts.find(item => item.value === whoMade)
    base.who_made = found?.value || 'all'
  }

  const minPrice = parseQueryPriceValue(routeQuery.min_price)
  const maxPrice = parseQueryPriceValue(routeQuery.max_price)
  base.min_price = minPrice
  base.max_price = maxPrice
  base.price = getPricePresetByBounds(minPrice, maxPrice, currency)

  return base
}

export function useProductFilterQuerySync(
  state: ProductFilterState,
  currency: Ref<string>,
) {
  const route = useRoute()
  const router = useRouter()

  const controlledQueryKeys = new Set<keyof ProductFilterState>([
    'is_digital',
    'price',
    'min_price',
    'max_price',
    'who_made',
    'attribute_filters',
  ])

  watch(state, () => {
    const routeQuery = Object.fromEntries(
      Object.entries(route.query).filter(([key]) => {
        return !/^attr_.+/.test(key)
          && !controlledQueryKeys.has(key as keyof ProductFilterState)
      }),
    ) as Record<string, string>

    Object.keys(state).forEach((key) => {
      const value = state[key as keyof ProductFilterState]

      if (key === 'attribute_filters') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((filter) => {
            if (!filter.facet_key || filter.selected_option_keys.length === 0) {
              return
            }

            routeQuery[`attr_${filter.facet_key}`] = filter.selected_option_keys.join(',')
          })
        }
        return
      }

      if (key === 'price') {
        const pricePreset = value as PricePresetId

        if (pricePreset === 'custom') {
          const minPriceMinor = majorPriceInputToMinor(state.min_price, currency.value)
          const maxPriceMinor = majorPriceInputToMinor(state.max_price, currency.value)

          if (minPriceMinor) {
            routeQuery.min_price = minPriceMinor
          }

          if (maxPriceMinor) {
            routeQuery.max_price = maxPriceMinor
          }

          return
        }

        const presetBounds = getPresetBounds(pricePreset, currency.value)

        if (presetBounds.min_price) {
          routeQuery.min_price = presetBounds.min_price
        }

        if (presetBounds.max_price) {
          routeQuery.max_price = presetBounds.max_price
        }

        return
      }

      if (key === 'min_price' || key === 'max_price') {
        return
      }

      if (typeof value === 'string' && value !== 'all') {
        routeQuery[key] = value
      }
    })

    router.push({ query: routeQuery })
  })
}
