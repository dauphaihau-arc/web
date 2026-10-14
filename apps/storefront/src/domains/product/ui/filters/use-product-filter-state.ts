import type { ProductFilterState } from '~/domains/product/ui/filters/product-filter.constants';

/**
 * Number of active filter selections in a state, counting each selected
 * attribute option plus one per active format, type, and price filter. Drives
 * the mobile filter button badge and the sheet's Clear label.
 */
export function countActiveFilters(state: ProductFilterState): number {
  return state.attributeFilters.reduce(
    (count, filter) => count + filter.selectedOptionKeys.length,
    0,
  ) +
  (state.isDigital !== 'all' ? 1 : 0) +
  (state.whoMade !== 'all' ? 1 : 0) +
  (state.price !== 'all' ? 1 : 0);
}

export function useProductFilterState(defaultState: ProductFilterState) {
  const state = reactive<ProductFilterState>({ ...defaultState });

  const isResetDisabled = computed(() => countActiveFilters(state) === 0);

  function resetFilters() {
    state.isDigital = 'all';
    state.price = 'all';
    state.minPrice = '';
    state.maxPrice = '';
    state.whoMade = 'all';
    state.attributeFilters = [];
  }

  return {
    state,
    isResetDisabled,
    resetFilters,
  };
}
