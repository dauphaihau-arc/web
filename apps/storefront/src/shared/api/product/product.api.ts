import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  GetDetailProductBySlugResponse,
  GetProductFacetsResponse,
  GetProductRecommendationSectionsResponse,
  GetProductRecommendationsResponse,
  GetProductSuggestionsResponse,
  GetProductsRequest,
  GetProductsResponse,
  RecordProductViewResponse
} from './contracts/product.contract';
import { apiClient } from '~/shared/lib/api-client';

export const productApi = {
  getDetailBySlug(
    shopSlug: string,
    productSlug: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.get<GetDetailProductBySlugResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}`,
      undefined,
      options
    );
  },

  getRecommendations(
    shopSlug: string,
    productSlug: string,
    limit?: number
  ) {
    return apiClient.get<GetProductRecommendationsResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/recommendations`,
      limit ? { limit } : undefined
    );
  },

  getRecommendationSections(
    shopSlug: string,
    productSlug: string,
    limit?: number
  ) {
    return apiClient.get<GetProductRecommendationSectionsResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/recommendation-sections`,
      limit ? { limit } : undefined
    );
  },

  getRecentlyViewed(limit?: number) {
    return apiClient.get<GetProductRecommendationsResponse>(
      '/products/recently-viewed',
      limit ? { limit } : undefined
    );
  },

  getTrending(limit?: number) {
    return apiClient.get<GetProductRecommendationsResponse>(
      '/products/trending',
      limit ? { limit } : undefined
    );
  },

  getBestSellers(limit?: number) {
    return apiClient.get<GetProductRecommendationsResponse>(
      '/products/best-sellers',
      limit ? { limit } : undefined
    );
  },

  recordView(shopSlug: string, productSlug: string) {
    return apiClient.post<RecordProductViewResponse>(
      `/products/by-slug/${shopSlug}/${productSlug}/views`
    );
  },

  getList(params?: GetProductsRequest) {
    return apiClient.get<GetProductsResponse>(
      '/products',
      params
    );
  },

  getFacets(params?: GetProductsRequest) {
    return apiClient.get<GetProductFacetsResponse>(
      '/products/facets',
      params
    );
  },

  getSuggestions(search: string, limit?: number) {
    return apiClient.get<GetProductSuggestionsResponse>(
      '/products/suggestions',
      {
        search,
        ...(limit ? { limit } : {}),
      }
    );
  },
};
