import type {
  CategorySearch,
  GetCategoriesRequest,
  GetCategoriesResponse,
  GetCategoryAttributesResponse
} from './categories';
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

  search(name: string) {
    return apiClient.get<{ categories: CategorySearch[] }>(
      '/categories/search',
      { name }
    );
  },
};
