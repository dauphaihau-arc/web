import type { Category } from '@arc/models/category';
import type { GetCategorySuggestionsResponse } from '~/domains/category/api/contracts/category.contract';
import { categoryApi } from '~/domains/category/api/category.api';

export function useGetSuggestCategories() {
  return useMutation({
    mutationKey: ['get-suggest-categories'],
    mutationFn: (name: Category['name']) => {
      return categoryApi.getSuggestions(name) as Promise<GetCategorySuggestionsResponse>;
    },
  });
}
