import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { ProductFilterState } from '~/domains/product/ui/filters/product-filter.constants';
import {
  DEFAULT_PRODUCT_SORT_ID,
  isProductSortId,
  type ProductSortId,
} from '~/domains/product/ui/filters/product-sort';
import {
  createDefaultFilterState,
  useProductFilterQuerySync,
} from '~/domains/product/ui/filters/use-product-filter-query-sync';
import { useProductFilterState } from '~/domains/product/ui/filters/use-product-filter-state';

export type ProductListingFilters = {
  state: ProductFilterState
  sortOrder: Ref<ProductSortId>
  isResetDisabled: ComputedRef<boolean>
  resetFilters: () => void
};

const PRODUCT_LISTING_FILTERS_KEY: InjectionKey<ProductListingFilters> = Symbol('product-listing-filters');

/**
 * Deep-copies filter state so the mobile sheet can stage edits on a draft and
 * commit them only on Apply. Nested attribute filters are cloned too, so draft
 * toggles never mutate the live state before Apply.
 */
export function cloneFilterState(state: ProductFilterState): ProductFilterState {
  return {
    ...state,
    attributeFilters: state.attributeFilters.map(filter => ({
      facetKey: filter.facetKey,
      attributeName: filter.attributeName,
      selectedOptionKeys: [...filter.selectedOptionKeys],
      selectedOptionValues: [...filter.selectedOptionValues],
    })),
  };
}

/**
 * Creates a product listing's filter and sort state for one page instance and
 * provides it to every filter surface — the desktop sidebar panel, the mobile
 * filter sheet, and the sort control — so they read and write a single reactive
 * state instead of each pushing their own route query.
 *
 * A listing is any page that renders those surfaces, scoped to a category or a
 * search; each listing provides its own instance.
 */
export function provideProductListingFilters(currency: Ref<string>): ProductListingFilters {
  const route = useRoute();

  const { state, isResetDisabled, resetFilters } = useProductFilterState(
    createDefaultFilterState(route.query, currency.value),
  );

  const sortOrder = ref<ProductSortId>(
    isProductSortId(route.query.order) ? route.query.order : DEFAULT_PRODUCT_SORT_ID,
  );

  useProductFilterQuerySync(state, currency, { sortOrder });

  const controller: ProductListingFilters = {
    state,
    sortOrder,
    isResetDisabled,
    resetFilters,
  };

  provide(PRODUCT_LISTING_FILTERS_KEY, controller);

  return controller;
}

export function useProductListingFilters(): ProductListingFilters {
  const controller = inject(PRODUCT_LISTING_FILTERS_KEY);

  if (!controller) {
    throw new Error('Product listing filters were not provided by the listing page.');
  }

  return controller;
}
