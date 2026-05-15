import { RESOURCES } from '~/config/enums/resources';
import type {
  Category, CategorySearch, GetCategoriesParams, ResponseGetCategories
} from '~/types/category';

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
  return useQuery<ResponseGetCategories>({
    enabled: !!params,
    queryKey: ['get-categories', params],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetCategories>(
        RESOURCES.CATEGORIES,
        params
      );
    },
  });
}

export function useGetRootCategories() {
  return useQuery<ResponseGetCategories>({
    queryKey: ['get-root-categories'],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetCategories>(RESOURCES.CATEGORIES);
    },
  });
}

export function useGetSearchCategories() {
  return useMutation({
    mutationKey: ['get-search-categories'],
    mutationFn: (name: Category['name']) => {
      return useCustomFetch.get<{ categories: CategorySearch[] }>(
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
      const response = await useCustomFetch.get<
        LegacyCategoryAttributesResponse | NestCategoryAttributesResponse
      >(
        `${RESOURCES.CATEGORIES}/${id}${RESOURCES.ATTRIBUTES}`
      );

      return normalizeCategoryAttributesResponse(response);
    },
  });
}
