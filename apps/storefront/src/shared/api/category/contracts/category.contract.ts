import type { z } from 'zod'
import type {
  categoryAttributeSelectSchema,
  categoryResponseSchema,
  categorySuggestionSchema,
  getCategoriesRequestSchema,
  getCategoriesResponseSchema,
  getCategoryAttributesResponseSchema,
  getCategorySuggestionsResponseSchema,
} from '@arc/schemas/api/category/category.schema'

export type GetCategoriesRequest = z.infer<typeof getCategoriesRequestSchema>
export type GetCategoriesResponse = z.infer<typeof getCategoriesResponseSchema>
export type CategoryResponse = z.infer<typeof categoryResponseSchema>

export type CategoryAttributeSelect = z.infer<typeof categoryAttributeSelectSchema>
export type GetCategoryAttributesResponse = z.infer<typeof getCategoryAttributesResponseSchema>

export type CategorySuggestion = z.infer<typeof categorySuggestionSchema>
export type GetCategorySuggestionsResponse = z.infer<typeof getCategorySuggestionsResponseSchema>
