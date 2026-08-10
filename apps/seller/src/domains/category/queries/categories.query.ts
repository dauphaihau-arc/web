import type { Category } from '@arc/models/category';
import { normalizeCategory } from '../utils/category.normalizer';
import { categoryApi } from '~/domains/category/api/category.api';
import type { GetCategoriesRequest as GetCategoriesParams } from '~/domains/category/api/contracts/category.contract';

export function useGetCategories(
  params?: GetCategoriesParams,
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
