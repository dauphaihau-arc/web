import { z } from 'zod'

export const categoryAttributeOptionResponseSchema = z.object({
  id: z.string(),
  value: z.string(),
  rank: z.number(),
})

export const categoryAttributeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  input_type: z.string(),
  is_required: z.boolean(),
  rank: z.number(),
  options: z.array(categoryAttributeOptionResponseSchema),
})

export const categoryResponseSchema = z.object({
  id: z.string(),
  parent_id: z.string().optional(),
  name: z.string(),
  rank: z.number(),
  image_storage_key: z.string().optional(),
  image_url: z.string().optional(),
  attributes: z.array(categoryAttributeResponseSchema),
})

export const getCategoriesRequestSchema = z.object({
  parent_id: z.string().optional(),
})

export const getCategoriesResponseSchema = z.array(categoryResponseSchema)

export const categoryAttributeSelectSchema = z.object({
  id: z.string(),
  name: z.string(),
  options: z.array(z.object({
    id: z.string(),
    value: z.string(),
  })).optional(),
})

export const nestedCategoryAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  options: z.array(categoryAttributeOptionResponseSchema),
})

export const getCategoryAttributesResponseSchema = z.union([
  z.object({ attributes: z.array(categoryAttributeSelectSchema) }),
  z.object({ attributes: z.array(nestedCategoryAttributeSchema) }),
])

export const categorySuggestionSchema = z.object({
  id: z.string(),
  lastNameCategory: z.string().optional(),
  categoriesRelated: z.array(z.string()).optional(),
  last_name_category: z.string().optional(),
  categories_related: z.array(z.string()).optional(),
})

export const getCategorySuggestionsResponseSchema = z.object({
  categories: z.array(categorySuggestionSchema),
})
