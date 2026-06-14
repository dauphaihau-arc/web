import type { ProductFilterState } from '~/app/components/product/filters/product-filter.constants';

export function useProductFilterState(defaultState: ProductFilterState) {
  const state = reactive<ProductFilterState>({ ...defaultState });

  const isResetDisabled = computed(() => {
    return state.isDigital === 'all' &&
      state.price === 'all' &&
      !state.minPrice &&
      !state.maxPrice &&
      state.whoMade === 'all' &&
      state.attributeFilters.length === 0;
  });

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
