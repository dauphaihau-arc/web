import type { Category, CategorySearch } from '~/shared/api/category/categories';
import { categoryApi } from '~/shared/api/category/category.api';

export function useGetSearchCategories() {
  return useMutation({
    mutationKey: ['get-search-categories'],
    mutationFn: (name: Category['name']) => {
      return categoryApi.search(name) as Promise<{ categories: CategorySearch[] }>;
    },
  });
}
