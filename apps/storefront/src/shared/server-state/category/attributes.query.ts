import type { Category } from '@arc/models/category'
import type {
  LegacyCategoryAttributesResponse,
  NestCategoryAttributesResponse,
} from './category.types'
import { normalizeCategoryAttributesResponse } from './category.types'
import { categoryApi } from '~/shared/api/category/category.api'

export function useGetAttributesByCategory(
  id: MaybeRefOrGetter<Category['id'] | undefined>,
) {
  return useQuery({
    enabled: computed(() => !!toValue(id)),
    queryKey: computed(() => ['get-attributes-by-category', toValue(id)]),
    queryFn: async () => {
      const categoryId = toValue(id)

      const response = await categoryApi.getAttributes(categoryId!)

      return normalizeCategoryAttributesResponse(
        response as LegacyCategoryAttributesResponse | NestCategoryAttributesResponse,
      )
    },
  })
}
