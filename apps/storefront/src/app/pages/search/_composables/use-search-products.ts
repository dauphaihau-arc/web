import { useGetProducts } from '~/domains/product/queries/products.query';
import { normalizeRouteQuery } from '~/shared/utils/route-query';

/**
 * Page size for the search listing. Kept as a module constant because the
 * listing is the single owner of search pagination.
 */
const PAGE_LIMIT = 30;

/**
 * Search listing state for the search page container.
 *
 * The keyword arrives as a live getter so a new search refetches instead of
 * reusing the previous page's results. Pagination stays local to the listing
 * while the active filters stay in the route query, which is why the current
 * query is the base of every request.
 */
export function useSearchProducts(search: MaybeRefOrGetter<string>) {
  const route = useRoute();

  const page = ref(1);

  const params = computed(() => ({
    page: page.value,
    limit: PAGE_LIMIT,
    search: toValue(search),
    ...normalizeRouteQuery(route.query),
  }));

  const { data, isPending, error } = useGetProducts(params);

  // A new keyword restarts the listing at page one; the request follows because
  // the keyword is part of its params.
  watch(() => toValue(search), () => {
    page.value = 1;
  });

  return {
    page,
    limit: PAGE_LIMIT,
    items: computed(() => data.value?.items),
    total: computed(() => data.value?.meta.total),
    loading: isPending,
    error,
  };
}
