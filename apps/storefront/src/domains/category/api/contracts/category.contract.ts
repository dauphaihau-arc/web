import type { z } from 'zod';
import type {
  categoryAncestryEntrySchema,
  categoryAttributeSelectSchema,
  categoryResolutionResponseSchema,
  categoryResponseSchema,
  categorySuggestionSchema,
  getCategoriesRequestSchema,
  getCategoriesResponseSchema,
  getCategoryAttributesResponseSchema,
  getCategorySuggestionsResponseSchema,
  resolvedCategorySchema,
} from '@arc/schemas/api/category/category.schema';

export type GetCategoriesRequest = z.infer<typeof getCategoriesRequestSchema>;
export type GetCategoriesResponse = z.infer<typeof getCategoriesResponseSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

export type CategoryResolutionResponse = z.infer<typeof categoryResolutionResponseSchema>;
export type ResolvedCategory = z.infer<typeof resolvedCategorySchema>;
export type CategoryAncestryEntry = z.infer<typeof categoryAncestryEntrySchema>;

export type CategoryAttributeSelect = z.infer<typeof categoryAttributeSelectSchema>;
export type GetCategoryAttributesResponse = z.infer<typeof getCategoryAttributesResponseSchema>;

export type CategorySuggestion = z.infer<typeof categorySuggestionSchema>;
export type GetCategorySuggestionsResponse = z.infer<typeof getCategorySuggestionsResponseSchema>;
