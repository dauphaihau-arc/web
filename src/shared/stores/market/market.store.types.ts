import type { Category } from '~/shared/api/category/category';
import type { ExchangeRatesResponse } from '~/shared/api/market/exchange-rates';

export type ExchangeRateStorage = {
  rates: ExchangeRatesResponse['rates']
  exp: number
};

export interface CategoriesBreadcrumbStorage extends Category {
  to: string
}

export type UserActivitiesSessionStorage = {
  categoryIdProductVisited: Category['id']
  rootCategoryProductVisited: Category
  subCategoriesLastVisit: Category[]
};
