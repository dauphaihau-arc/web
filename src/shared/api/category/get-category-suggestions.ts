import type { Category } from './category';

export type CategorySuggestion = {
  id: Category['id']
  lastNameCategory?: Category['name']
  categoriesRelated?: Category['name'][]
  last_name_category?: Category['name']
  categories_related?: Category['name'][]
};

export type GetCategorySuggestionsResponse = {
  categories: CategorySuggestion[]
};
