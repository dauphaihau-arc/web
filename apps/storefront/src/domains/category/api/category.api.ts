import type {
  GetCategoryAttributesResponse,
  GetCategoriesRequest,
  GetCategoriesResponse,
  GetCategorySuggestionsResponse,
  CategoryResolutionResponse,
} from './contracts/category.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const categoryApi = {
  getAttributes(id: string) {
    return apiClient.get<GetCategoryAttributesResponse>(
      `/categories/${id}/attributes`,
    );
  },

  /**
   * Resolve a category public identity to its authoritative current slug,
   * ordered ancestry (root-to-current, including the category itself), and
   * canonical flat URL.
   */
  resolve(id: string) {
    return apiClient.get<CategoryResolutionResponse>(
      `/categories/${id}`,
    );
  },

  getCategories(params?: GetCategoriesRequest) {
    return apiClient.get<GetCategoriesResponse>(
      '/categories',
      params,
    );
  },

  getSuggestions(name: string) {
    return apiClient.get<GetCategorySuggestionsResponse>(
      '/categories/suggestions',
      { name },
    );
  },
};
