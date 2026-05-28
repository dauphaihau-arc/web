import type { Category } from '@arc/models/category'

export interface CategoriesBreadcrumbStorage extends Category {
  to: string
}

export type UserActivitiesSessionStorage = {
  categoryIdProductVisited: Category['id']
  rootCategoryProductVisited: Category
  subCategoriesLastVisit: Category[]
}
