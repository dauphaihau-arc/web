import type { Category } from '@arc/models/category';
import type {
  LegacyCategoryAttributesResponse,
  NestCategoryAttributesResponse,
} from '../utils/category.normalizer';
import { normalizeCategoryAttributesResponse } from '../utils/category.normalizer';
import { categoryApi } from '~/domains/category/api/category.api';

export function useGetAttributesByCategory(id?: Category['id']) {
  return useQuery({
    enabled: !!id,
    queryKey: ['get-attributes-by-category'],
    queryFn: async () => {
      const response = await categoryApi.getAttributes(id!);

      return normalizeCategoryAttributesResponse(
        response as LegacyCategoryAttributesResponse | NestCategoryAttributesResponse,
      );
    },
  });
}
