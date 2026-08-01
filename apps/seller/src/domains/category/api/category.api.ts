import type {
  GetCategoryAttributesResponse
  ,
  GetCategoriesRequest,
  GetCategoriesResponse
  ,
  GetCategorySuggestionsResponse
} from './contracts/category.contract';
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
