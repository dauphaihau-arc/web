import type { Category } from '@arc/models/category';
import type { GetCategorySuggestionsResponse } from '~/shared/api/category/contracts/category.contract';
import { categoryApi } from '~/shared/api/category/category.api';

export function useGetSuggestCategories() {
  return useMutation({
    mutationKey: ['get-suggest-categories'],
    mutationFn: (name: Category['name']) => {
      return categoryApi.getSuggestions(name) as Promise<GetCategorySuggestionsResponse>;
    },
  });
}
