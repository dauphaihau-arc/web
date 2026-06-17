import type { Category } from '@arc/models/category';
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract';

export interface CategoriesBreadcrumbStorage extends Category {
  to: string
}

export type UserActivitiesSessionStorage = {
  categoryIdProductVisited: Category['id']
  rootCategoryProductVisited: Category
  subCategoriesLastVisit: Category[]
};

export interface RecentProductViewStorage {
  product: GetProductsResponseItem
  viewedAt: string
}
