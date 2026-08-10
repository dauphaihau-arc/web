import type { Category } from '@arc/models/category';
import type {
  LegacyCategoryAttributesResponse,
  NestCategoryAttributesResponse,
} from '../utils/category.normalizer';
import { normalizeCategoryAttributesResponse } from '../utils/category.normalizer';
import { categoryApi } from '~/domains/category/api/category.api';

export function useGetAttributesByCategory(
  id: MaybeRefOrGetter<Category['id'] | undefined>,
) {
  return useQuery({
    enabled: computed(() => !!toValue(id)),
    queryKey: computed(() => ['get-attributes-by-category', toValue(id)]),
    queryFn: async () => {
      const categoryId = toValue(id);

      const response = await categoryApi.getAttributes(categoryId!);

      return normalizeCategoryAttributesResponse(
        response as LegacyCategoryAttributesResponse | NestCategoryAttributesResponse,
      );
    },
  });
}
