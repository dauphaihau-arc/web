import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import type {
  GetDetailProductBySlugResponse,
  GetProductFacetsResponse,
  GetProductRecommendationSectionsResponse,
  GetProductRecommendationsResponse,
  GetPublicProductReviewImagesResponse,
  GetProductSuggestionsResponse,
  GetPublicProductReviewsResponse,
  GetProductsRequest,
  GetProductsResponse,
  RecordProductViewResponse,
} from './contracts/product.contract'
import { apiClient } from '~/shared/lib/api-client'

export const productApi = {
  getDetailBySlug(
    shopSlug: string,
    productSlug: string,
    options?: NitroFetchOptions<NitroFetchRequest>,
  ) {
    return apiClient.get<GetDetailProductBySlugResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}`,
      undefined,
      options,
    )
  },

  getReviews(
    shopSlug: string,
    productSlug: string,
    params?: {
      page?: number
      limit?: number
      sort?: 'all' | 'most_recent' | 'newest' | 'highest_rating' | 'lowest_rating'
      rating?: 1 | 2 | 3 | 4 | 5
      has_images?: boolean
      has_comment?: boolean
    },
  ) {
    return apiClient.get<GetPublicProductReviewsResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/reviews`,
      params,
    )
  },

  getReviewImages(
    shopSlug: string,
    productSlug: string,
    params?: {
      cursor?: string
      limit?: number
    },
  ) {
    return apiClient.get<GetPublicProductReviewImagesResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/review-images`,
      params,
    )
  },

  getRecommendations(
    shopSlug: string,
    productSlug: string,
    limit?: number,
  ) {
    return apiClient.get<GetProductRecommendationsResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/recommendations`,
      limit ? { limit } : undefined,
    )
  },

  getRecommendationSections(
    shopSlug: string,
    productSlug: string,
    limit?: number,
  ) {
    return apiClient.get<GetProductRecommendationSectionsResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/recommendation-sections`,
      limit ? { limit } : undefined,
    )
  },

  getRecentlyViewed(limit?: number) {
    return apiClient.get<GetProductRecommendationsResponse>(
      '/products/recently-viewed',
      limit ? { limit } : undefined,
    )
  },

  getTrending(limit?: number) {
    return apiClient.get<GetProductRecommendationsResponse>(
      '/products/trending',
      limit ? { limit } : undefined,
    )
  },

  getBestSellers(limit?: number) {
    return apiClient.get<GetProductRecommendationsResponse>(
      '/products/best-sellers',
      limit ? { limit } : undefined,
    )
  },

  recordView(shopSlug: string, productSlug: string) {
    return apiClient.post<RecordProductViewResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/views`,
    )
  },

  getList(params?: GetProductsRequest) {
    return apiClient.get<GetProductsResponse>(
      '/products',
      params,
    )
  },

  getFacets(params?: GetProductsRequest) {
    return apiClient.get<GetProductFacetsResponse>(
      '/products/facets',
      params,
    )
  },

  getSuggestions(search: string, limit?: number) {
    return apiClient.get<GetProductSuggestionsResponse>(
      '/products/suggestions',
      {
        search,
        ...(limit ? { limit } : {}),
      },
    )
  },
}
