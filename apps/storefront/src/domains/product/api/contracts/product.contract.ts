import type { z } from 'zod';
import type { components } from '@arc/schemas/api/generated/openapi';
import type {
  getDetailProductBySlugResponseSchema,
  getProductRecommendationSectionsResponseSchema,
  getProductRecommendationsResponseSchema,
  getProductsRequestSchema,
  getProductsResponseItemSchema,
  getProductsResponseSchema,
} from '@arc/schemas/api/product/product.schema';

export type GetProductsRequest = z.input<typeof getProductsRequestSchema>;
/**
 * The contract omits the product list query parameters, and types list image
 * variant maps as empty objects, so the list/item/recommendation responses stay
 * modelled by the local schema.
 */
export type GetProductsResponseItem = z.infer<typeof getProductsResponseItemSchema>;
export type GetProductsResponse = z.infer<typeof getProductsResponseSchema>;
export type ProductFacet = components['schemas']['PublicProductFacetItemResponseDto'];
export type GetProductFacetsResponse = components['schemas']['PublicProductFacetResponseDto'];
export type ProductSuggestion = components['schemas']['PublicProductSuggestionResponseDto'];
export type GetProductSuggestionsResponse = components['schemas']['PublicProductSuggestionListResponseDto'];
export type GetProductRecommendationsResponse = z.infer<typeof getProductRecommendationsResponseSchema>;
export type GetProductRecommendationSectionsResponse = z.infer<typeof getProductRecommendationSectionsResponseSchema>;
export type RecordProductViewResponse = components['schemas']['RecordProductViewResponseDto'];
/**
 * The contract types variant `lifecycle_state`/`removed_at` away and types
 * image variant maps as empty objects; the product page reads both, so the
 * detail response stays modelled by the local schema.
 */
export type GetDetailProductBySlugResponse = z.infer<typeof getDetailProductBySlugResponseSchema>;
export type GetPublicProductReviewsResponse = components['schemas']['PublicProductReviewListResponseDto'];
export type GetPublicProductReviewImagesResponse = components['schemas']['PublicProductReviewImageListResponseDto'];
