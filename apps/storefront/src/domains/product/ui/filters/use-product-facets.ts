import type { Category } from '@arc/models/category';
import type { AttributeFilter } from '~/domains/product/ui/filters/product-filter.constants';
import { categoryApi } from '~/domains/category/api/category.api';
import { normalizeCategory } from '~/domains/category/utils/category.normalizer';
import { buildFacetOptionView } from '~/domains/product/ui/filters/facet-option-view';
import {
  buildFacetBaselineQuery,
  buildFacetRequestQuery,
} from '~/domains/product/ui/filters/product-filter-query';
import { useGetProductFacets } from '~/domains/product/queries/products.query';

type ProductFacetsInput = {
  categoryId: MaybeRefOrGetter<string | undefined>
  /** Current shopper selections; selected options stay visible and clearable. */
  selections: MaybeRefOrGetter<AttributeFilter[]>
  /** When the category has children, only these facet keys are offered. */
  featuredFacetKeys?: MaybeRefOrGetter<string[] | undefined>
};

/**
 * Category-scoped facet panel data shared by the desktop filter panel and the
 * mobile filter sheet: the option list, availability flags, and loading state.
 *
 * The filtered request carries the active filter set so the backend computes
 * each facet's alternatives with every filter except its own; the baseline
 * request omits filters so an option never disappears from the panel. Both
 * share a query key, so mounting the panel twice costs one request each.
 */
export function useProductFacets(input: ProductFacetsInput) {
  const route = useRoute();

  const facetParams = computed(() => {
    const categoryId = toValue(input.categoryId);

    if (!categoryId) {
      return undefined;
    }

    return buildFacetRequestQuery(categoryId, route.query);
  });

  const {
    data: dataGetProductFacets,
    isPending: isPendingGetProductFacets,
  } = useGetProductFacets(facetParams);

  const baselineFacetParams = computed(() => {
    const categoryId = toValue(input.categoryId);

    return categoryId ? buildFacetBaselineQuery(categoryId) : undefined;
  });

  const {
    data: dataBaselineFacets,
    isPending: isPendingBaselineFacets,
  } = useGetProductFacets(baselineFacetParams);

  const {
    data: dataChildCategories,
    isPending: isPendingGetChildCategories,
  } = useQuery<Category[]>({
    enabled: computed(() => !!toValue(input.categoryId)),
    queryKey: computed(() => ['get-child-categories', toValue(input.categoryId)]),
    queryFn: async () => {
      const categoryId = toValue(input.categoryId);

      if (!categoryId) {
        return [];
      }

      const response = await categoryApi.getCategories({
        parent_id: categoryId,
      });

      return response.map(normalizeCategory);
    },
  });

  const isLoading = computed(() => {
    return isPendingGetProductFacets.value
      || isPendingBaselineFacets.value
      || isPendingGetChildCategories.value;
  });

  const facets = computed(() => {
    const view = buildFacetOptionView({
      baselineFacets: dataBaselineFacets.value?.facets ?? [],
      filteredFacets: dataGetProductFacets.value?.facets ?? [],
      selections: toValue(input.selections),
      // The filtered response is keyed by the active filters, so when it exists
      // it describes the current selection. While it is pending or errored there
      // is no availability signal, so unselected options stay disabled until it
      // resolves rather than being enabled from stale data.
      hasFilteredAvailability: dataGetProductFacets.value !== undefined,
    });

    const hasChildren = (dataChildCategories.value ?? []).length > 0;
    const allowedFacetKeys = toValue(input.featuredFacetKeys);

    if (!hasChildren || !allowedFacetKeys) {
      return view;
    }

    return view.filter(facet => allowedFacetKeys.includes(facet.facetKey));
  });

  return { facets, isLoading };
}
