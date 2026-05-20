import { normalizeCategory } from './category.types';
import { categoryApi } from '~/shared/api/category/category.api';
import type {
  Category,
  GetCategoriesParams
} from '~/shared/types/category';

export function useGetCategories(
  params?: GetCategoriesParams
) {
  return useQuery<Category[]>({
    enabled: !!params,
    queryKey: ['get-categories', params],
    queryFn: async () => {
      const response = await categoryApi.getCategories(params);

      return response.map(normalizeCategory);
    },
  });
}

export function useGetRootCategories() {
  return useQuery<Category[]>({
    queryKey: ['get-root-categories'],
    queryFn: async () => {
      const response = await categoryApi.getCategories();

      return response.map(normalizeCategory);
    },
  });
}
