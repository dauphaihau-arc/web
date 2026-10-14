/**
 * Product listing sort options shared by the desktop toolbar select and the
 * mobile filter sheet. `featured` is the default and is never written to the
 * route query, so it doubles as "no explicit order".
 */
export type ProductSortId = 'featured' | 'newest' | 'price_asc' | 'price_desc';

export type ProductSortOption = {
  id: ProductSortId
  label: string
};

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_desc', label: 'Price: High-Low' },
  { id: 'price_asc', label: 'Price: Low-High' },
];

export const DEFAULT_PRODUCT_SORT_ID: ProductSortId = 'featured';

/** Narrows an arbitrary route query value to a known sort id. */
export function isProductSortId(value: unknown): value is ProductSortId {
  return typeof value === 'string'
    && PRODUCT_SORT_OPTIONS.some(option => option.id === value);
}
