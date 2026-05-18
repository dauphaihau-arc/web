import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
import type {
  Category, CategorySearch, GetCategoriesParams, ResponseGetCategories
} from '~/shared/types/category';

export type CategoryAttributeSelect = {
  id: string
  name: string
  options?: {
    id: string
    value: string
  }[]
};

type NestCategoryAttributeOption = {
  id: string
  value: string
  rank: number
};

type NestCategoryAttribute = {
  id: string
  name: string
  options: NestCategoryAttributeOption[]
};

type NestCategoryAttributesResponse = {
  attributes: NestCategoryAttribute[]
};

type LegacyCategoryAttributesResponse = {
  attributes: CategoryAttributeSelect[]
};

function normalizeCategory(response: ResponseGetCategories[number]): Category {
  return {
    id: response.id,
    parentId: response.parent_id,
    name: response.name,
    rank: response.rank,
    imageStorageKey: response.image_storage_key,
    imageUrl: response.image_url,
    attributes: response.attributes.map(attribute => ({
      id: attribute.id,
      name: attribute.name,
      inputType: attribute.input_type,
      isRequired: attribute.is_required,
      rank: attribute.rank,
      options: attribute.options.map(option => ({
        id: option.id,
        value: option.value,
        rank: option.rank,
      })),
    })),
  };
}

function normalizeCategoryAttributesResponse(
  response: LegacyCategoryAttributesResponse | NestCategoryAttributesResponse
): LegacyCategoryAttributesResponse {
  return {
    attributes: response.attributes.map(attribute => ({
      ...attribute,
      options: attribute.options?.map(option =>
        typeof option === 'string' ?
          {
            id: option,
            value: option,
          } :
          {
            id: option.id,
            value: option.value,
          }
      ),
    })),
  };
}

export function useGetCategories(
  params?: GetCategoriesParams
) {
  return useQuery<Category[]>({
    enabled: !!params,
    queryKey: ['get-categories', params],
    queryFn: async () => {
      const response = await apiClient.get<ResponseGetCategories>(
        RESOURCES.CATEGORIES,
        params
      );

      return response.map(normalizeCategory);
    },
  });
}

export function useGetRootCategories() {
  return useQuery<Category[]>({
    queryKey: ['get-root-categories'],
    queryFn: async () => {
      const response = await apiClient.get<ResponseGetCategories>(RESOURCES.CATEGORIES);

      return response.map(normalizeCategory);
    },
  });
}

export function useGetSearchCategories() {
  return useMutation({
    mutationKey: ['get-search-categories'],
    mutationFn: (name: Category['name']) => {
      return apiClient.get<{ categories: CategorySearch[] }>(
        `${RESOURCES.CATEGORIES}/search`,
        {
          name,
        }
      );
    },
  });
}

export function useGetAttributesByCategory(id?: Category['id']) {
  return useQuery({
    enabled: !!id,
    queryKey: ['get-attributes-by-category'],
    queryFn: async () => {
      const response = await apiClient.get<
        LegacyCategoryAttributesResponse | NestCategoryAttributesResponse
      >(
        `${RESOURCES.CATEGORIES}/${id}${RESOURCES.ATTRIBUTES}`
      );

      return normalizeCategoryAttributesResponse(response);
    },
  });
}
