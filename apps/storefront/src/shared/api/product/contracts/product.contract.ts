import type { z } from 'zod'
import type {
  getDetailProductBySlugResponseSchema,
  getProductFacetsResponseSchema,
  getProductRecommendationSectionsResponseSchema,
  getProductRecommendationsResponseSchema,
  recordProductViewResponseSchema,
  getProductSuggestionsResponseSchema,
  getProductsRequestSchema,
  getProductsResponseItemSchema,
  getProductsResponseSchema,
  publicProductFacetSchema,
  productSuggestionSchema,
} from '@arc/schemas/api/product/product.schema'

export type GetProductsRequest = z.input<typeof getProductsRequestSchema>
export type GetProductsResponseItem = z.infer<typeof getProductsResponseItemSchema>
export type GetProductsResponse = z.infer<typeof getProductsResponseSchema>
export type ProductFacet = z.infer<typeof publicProductFacetSchema>
export type GetProductFacetsResponse = z.infer<typeof getProductFacetsResponseSchema>
export type ProductSuggestion = z.infer<typeof productSuggestionSchema>
export type GetProductSuggestionsResponse = z.infer<typeof getProductSuggestionsResponseSchema>
export type GetProductRecommendationsResponse = z.infer<typeof getProductRecommendationsResponseSchema>
export type GetProductRecommendationSectionsResponse = z.infer<typeof getProductRecommendationSectionsResponseSchema>
export type RecordProductViewResponse = z.infer<typeof recordProductViewResponseSchema>
export type GetDetailProductBySlugResponse = z.infer<typeof getDetailProductBySlugResponseSchema>
