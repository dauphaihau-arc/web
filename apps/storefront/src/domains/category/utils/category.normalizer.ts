import type { Category } from '@arc/models/category';
import type {
  CategoryAncestryEntry,
  CategoryAttributeSelect,
  CategoryResolutionResponse,
  GetCategoriesResponse,
} from '~/domains/category/api/contracts/category.contract';

type NestCategoryAttributeOption = {
  id: string
  value: string
  rank: number
};

type NestCategoryAttribute = {
  id: string
  key: string
  name: string
  options: NestCategoryAttributeOption[]
};

export type NestCategoryAttributesResponse = {
  attributes: NestCategoryAttribute[]
};

export type LegacyCategoryAttributesResponse = {
  attributes: CategoryAttributeSelect[]
};

export function normalizeCategory(response: GetCategoriesResponse[number]): Category {
  return {
    id: response.id,
    parentId: response.parent_id,
    name: response.name,
    slug: response.slug,
    rank: response.rank,
    imageUrl: response.image_url,
    featuredFacetKeys: response.featured_facet_keys,
    attributes: response.attributes.map(attribute => ({
      id: attribute.id,
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
  };
}

export type ResolvedCategorySummary = {
  id: string
  slug: string
  name: string
  featuredFacetKeys?: string[]
};

export type CategoryResolution = {
  category: ResolvedCategorySummary
  ancestry: CategoryAncestryEntry[]
  canonicalPath: string
};

export function normalizeCategoryResolution(
  response: CategoryResolutionResponse,
): CategoryResolution {
  return {
    category: {
      id: response.category.id,
      slug: response.category.slug,
      name: response.category.name,
      featuredFacetKeys: response.category.featured_facet_keys,
    },
    ancestry: response.ancestry.map(entry => ({
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
    })),
    canonicalPath: response.canonical_path,
  };
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
  };
}
