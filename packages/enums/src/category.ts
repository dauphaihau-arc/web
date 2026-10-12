export const CATEGORY_CONFIG = {
  MAX_CHAR_NAME: 50,
}

/**
 * Version of the category identifier contract shared by clients and the API.
 * Bump whenever persisted client state or request payloads change the meaning
 * of category identifiers, so outdated clients can be forced to reload.
 */
export const CATEGORY_IDENTITY_CONTRACT = {
  VERSION: '2',
  STORAGE_KEY: 'category-identity-contract-version',
} as const

/** Session/user-activity keys that carry a category identifier. */
export const CATEGORY_BEARING_ACTIVITY_KEYS = [
  'categoryIdProductVisited',
  'rootCategoryProductVisited',
  'subCategoriesLastVisit',
] as const

