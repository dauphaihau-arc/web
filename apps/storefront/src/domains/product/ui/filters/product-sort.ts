/**
 * Product listing sort options shared by the desktop toolbar select and the
 * mobile filter sheet. `featured` is the default and is never written to the
 * route query, so it doubles as "no explicit order".
 *
 * Labels are locale keys, not display copy: the surfaces resolve them with
 * `useI18n` so the stored sort id stays language-neutral.
 */
export type ProductSortId = 'featured' | 'newest' | 'price_asc' | 'price_desc';

export type ProductSortOption = {
  id: ProductSortId
  labelKey: string
};

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { id: 'featured', labelKey: 'catalog.sort.featured' },
  { id: 'newest', labelKey: 'catalog.sort.newest' },
  { id: 'price_desc', labelKey: 'catalog.sort.priceHighLow' },
  { id: 'price_asc', labelKey: 'catalog.sort.priceLowHigh' },
];

export const DEFAULT_PRODUCT_SORT_ID: ProductSortId = 'featured';

/** Narrows an arbitrary route query value to a known sort id. */
export function isProductSortId(value: unknown): value is ProductSortId {
  return typeof value === 'string'
    && PRODUCT_SORT_OPTIONS.some(option => option.id === value);
}
