import type { z } from 'zod'
import type {
  getDetailProductBySlugResponseSchema,
  getProductSuggestionsResponseSchema,
  getProductsRequestSchema,
  getProductsResponseItemSchema,
  getProductsResponseSchema,
  productSuggestionSchema,
} from '@arc/schemas/api/product/product.schema'

export type GetProductsRequest = z.infer<typeof getProductsRequestSchema>
export type GetProductsResponseItem = z.infer<typeof getProductsResponseItemSchema>
export type GetProductsResponse = z.infer<typeof getProductsResponseSchema>
export type ProductSuggestion = z.infer<typeof productSuggestionSchema>
export type GetProductSuggestionsResponse = z.infer<typeof getProductSuggestionsResponseSchema>
export type GetDetailProductBySlugResponse = z.infer<typeof getDetailProductBySlugResponseSchema>
