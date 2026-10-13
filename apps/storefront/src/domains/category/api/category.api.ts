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

  /**
   * Resolve a permanently owned legacy hierarchical path (e.g.
   * `/c/home/gaming-laptops`) to the current category and canonical URL. The
   * backend matches the recorded path owner and returns the latest slug, so the
   * caller redirects to the current canonical URL rather than any earlier one.
   */
  resolveLegacyPath(path: string) {
    return apiClient.get<CategoryResolutionResponse>(
      '/categories/legacy-path',
      { path },
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
