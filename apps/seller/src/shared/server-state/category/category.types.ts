import type { Category } from '@arc/models/category'
import type { CategoryAttributeSelect, GetCategoriesResponse } from '~/shared/api/category/contracts/category.contract'

type NestCategoryAttributeOption = {
  id: string
  value: string
  rank: number
}

type NestCategoryAttribute = {
  id: string
  key: string
  name: string
  options: NestCategoryAttributeOption[]
}

export type NestCategoryAttributesResponse = {
  attributes: NestCategoryAttribute[]
}

export type LegacyCategoryAttributesResponse = {
  attributes: CategoryAttributeSelect[]
}

export function normalizeCategory(response: GetCategoriesResponse[number]): Category {
  return {
    id: response.id,
    parentId: response.parent_id,
    name: response.name,
    rank: response.rank,
    imageStorageKey: response.image_storage_key,
    imageUrl: response.image_url,
    featuredFacetKeys: response.featured_facet_keys,
    attributes: response.attributes.map(attribute => ({
      id: attribute.id,
      key: attribute.key,
      name: attribute.name,
      inputType: attribute.input_type,
      isRequired: attribute.is_required,
      rank: attribute.rank,
      options: attribute.options.map(option => ({
        id: option.id,
        value: option.value,
        rank: option.rank,
      })),
    })),
  }
}

export function normalizeCategoryAttributesResponse(
  response: LegacyCategoryAttributesResponse | NestCategoryAttributesResponse,
): LegacyCategoryAttributesResponse {
  return {
    attributes: response.attributes.map(attribute => ({
      ...attribute,
      key: attribute.key,
      options: attribute.options?.map(option =>
        typeof option === 'string'
          ? {
              id: option,
              value: option,
            }
          : {
              id: option.id,
              value: option.value,
            },
      ),
    })),
  }
}
