import type {
  LegacyCategoryAttributesResponse,
  NestCategoryAttributesResponse
} from './category.types';
import { normalizeCategoryAttributesResponse } from './category.types';
import { categoryApi } from '~/shared/api/category/category.api';
import type { Category } from '~/shared/models/category';

export function useGetAttributesByCategory(id?: Category['id']) {
  return useQuery({
    enabled: !!id,
    queryKey: ['get-attributes-by-category'],
    queryFn: async () => {
      const response = await categoryApi.getAttributes(id!);

      return normalizeCategoryAttributesResponse(
        response as LegacyCategoryAttributesResponse | NestCategoryAttributesResponse
      );
    },
  });
}
