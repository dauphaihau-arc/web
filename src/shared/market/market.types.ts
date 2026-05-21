import type { MarketCurrencies, MarketRegions } from '~/shared/config/enums/market';
import type { Category } from '~/shared/api/category/categories';

export type ExchangeRatesResponse = {
  rates: { [key: string]: number }
  time_next_update_unix: number
};

export type IpDataResponse = Record<
  'emoji_flag' | 'region' | 'city', string
> & {
  country_name: MarketRegions
  currency: { code: MarketCurrencies }
};

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
