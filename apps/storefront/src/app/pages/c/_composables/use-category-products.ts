import { useGetProducts } from '~/domains/product/queries/products.query';
import {
  isAttributeFilterQueryKey,
  isProductFilterQueryKey,
} from '~/domains/product/ui/filters/product-filter-query';

/**
 * Page size for the category listing. Kept as a module constant because the
 * listing is the single owner of category pagination.
 */
const PAGE_LIMIT = 16;

function getRoutePage(queryPage: unknown): number {
  const value = Array.isArray(queryPage) ? queryPage[0] : queryPage;
  const parsedPage = Number(value);

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function normalizeRouteQuery(query: Record<string, unknown>): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      normalized[key] = value;
      return;
    }

    if (Array.isArray(value)) {
      const entries = value.filter((entry): entry is string => typeof entry === 'string');

      if (entries.length > 0) {
        normalized[key] = entries;
      }
    }
  });

  return normalized;
}

function hasActiveFilterQuery(query: Record<string, unknown>): boolean {
  return Object.entries(query).some(([key, value]) => {
    if (isAttributeFilterQueryKey(key)) {
      return true;
    }

    if (!isProductFilterQueryKey(key)) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.some(entry => typeof entry === 'string' && entry.length > 0);
    }

    return typeof value === 'string' && value.length > 0;
  });
}

/**
 * Category listing state for the category page container.
 *
 * The route query is the single source of truth for pagination: `page` is a
 * writable computed over `route.query.page`, so there is no local copy to keep
 * in sync. Products are only requested once an authoritative category identity
 * is resolved; the id arrives as a live getter so a category change refetches
 * with the new id instead of reusing a stale one.
 */
export function useCategoryProducts(categoryId: MaybeRefOrGetter<string | undefined>) {
  const route = useRoute();
  const router = useRouter();

  const params = computed(() => {
    const resolvedCategoryId = toValue(categoryId);

    if (!resolvedCategoryId) {
      return undefined;
    }

    return {
      ...normalizeRouteQuery(route.query),
      category_id: resolvedCategoryId,
      page: getRoutePage(route.query.page),
      limit: PAGE_LIMIT,
    };
  });

  const { data, isPending, error } = useGetProducts(params);

  const page = computed<number>({
    get: () => getRoutePage(route.query.page),
    set: (nextPage) => {
      const targetPage = Number.isInteger(nextPage) && nextPage > 0 ? nextPage : 1;

      if (targetPage === getRoutePage(route.query.page)) {
        return;
      }

      const query = { ...route.query };

      if (targetPage > 1) {
        query.page = String(targetPage);
      }
      else {
        delete query.page;
      }

      void router.push({ query });
    },
  });

  // Scroll is a route-page side effect, not derived state: it runs after the
  // page changes from either pagination or browser history. Kept out of the
  // `page` getter so the computed stays pure, and browser-only so SSR never
  // touches `window`.
  watch(() => route.query.page, () => {
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  return {
    page,
    limit: PAGE_LIMIT,
    items: computed(() => data.value?.items),
    total: computed(() => data.value?.meta.total),
    loading: isPending,
    error,
    hasActiveFilters: computed(() => hasActiveFilterQuery(route.query)),
  };
}
