import type {
  GetCategoryAttributesResponse
} from './get-category-attributes';
import type {
  GetCategoriesRequest,
  GetCategoriesResponse
} from './get-categories';
import type {
  GetCategorySuggestionsResponse
} from './get-category-suggestions';
import { apiClient } from '~/shared/lib/api-client';

export const categoryApi = {
  getAttributes(id: string) {
    return apiClient.get<GetCategoryAttributesResponse>(
      `/categories/${id}/attributes`
    );
  },

  getCategories(params?: GetCategoriesRequest) {
    return apiClient.get<GetCategoriesResponse>(
      '/categories',
      params
    );
  },

  getSuggestions(name: string) {
    return apiClient.get<GetCategorySuggestionsResponse>(
      '/categories/suggestions',
      { name }
    );
  },
};
