import type { MarketRegions, MarketCurrencies } from '~/shared/config/enums/market';
import type { Category } from '~/shared/types/category';

export type ResponseGetExchangeRates = {
  rates: { [key: string]: number }
  time_next_update_unix: number
};

export type ResponseGetDataByIP = Record<
  'emoji_flag' | 'region' | 'city', string
> & {
  country_name: MarketRegions
  currency: { code: MarketCurrencies }
};

export type ExchangeRateStorage = {
  rates: ResponseGetExchangeRates['rates']
  exp: number
};

export interface CategoriesBreadcrumbStorage extends Category {
  to: string
}

export type UserActivitiesSessionStorage = {
  categoryIdProductVisited: Category['id'] // set category_id each visit detail product page
  rootCategoryProductVisited: Category // set root category each redirect from home page
  subCategoriesLastVisit: Category[]
};
