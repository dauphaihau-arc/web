import type { ProductFilterState } from '~/app/components/product/filters/product-filter.constants'

export function useProductFilterState(defaultState: ProductFilterState) {
  const state = reactive<ProductFilterState>({ ...defaultState })

  const isResetDisabled = computed(() => {
    return state.is_digital === 'all'
      && state.price === 'all'
      && !state.min_price
      && !state.max_price
      && state.who_made === 'all'
      && state.attribute_filters.length === 0
  })

  function resetFilters() {
    state.is_digital = 'all'
    state.price = 'all'
    state.min_price = ''
    state.max_price = ''
    state.who_made = 'all'
    state.attribute_filters = []
  }

  return {
    state,
    isResetDisabled,
    resetFilters,
  }
}
