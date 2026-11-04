import type { z } from 'zod';
import type { components, operations } from '@arc/schemas/api/generated/openapi';
import type {
  categoryAttributeSelectSchema,
  getCategoryAttributesResponseSchema,
} from '@arc/schemas/api/category/category.schema';

export type GetCategoriesRequest = NonNullable<
  operations['Category_categories']['parameters']['query']
>;
export type GetCategoriesResponse = components['schemas']['CategoryResponseDto'][];
export type CategoryResponse = components['schemas']['CategoryResponseDto'];

export type CategoryResolutionResponse = components['schemas']['CategoryResolutionResponseDto'];
export type ResolvedCategory = components['schemas']['CategoryResolutionCategoryResponseDto'];
export type CategoryAncestryEntry = components['schemas']['CategoryAncestorResponseDto'];

export type CategoryAttributeSelect = z.infer<typeof categoryAttributeSelectSchema>;
export type GetCategoryAttributesResponse = z.infer<typeof getCategoryAttributesResponseSchema>;

export type CategorySuggestion = components['schemas']['CategorySuggestionResponseDto'];
export type GetCategorySuggestionsResponse = components['schemas']['CategorySuggestionListResponseDto'];
