import type { Category } from '~/shared/models/category';
import type { ExchangeRatesResponse } from '~/shared/api/market/contracts/market.contract';

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
