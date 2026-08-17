import type { VariantColumn, VariantTable } from './variant-input.types';

export const VARIANT_GROUP_1_FALLBACK_LABEL = 'Group variant 1';
export const VARIANT_GROUP_2_FALLBACK_LABEL = 'Group variant 2';
export const REQUIRED_ERROR = 'Required';
export const DUPLICATE_ERROR = 'Duplicate';
export const REQUIRED_VARIANT_ERROR = 'Required at least 1 variant';

export const DEFAULT_VARIANT_TABLE: VariantTable = {
  id: 1,
  variant_name: '',
  amount: undefined,
  stock: 0,
  sku: '',
  errorAmount: '',
  errorStock: '',
};

export const DEFAULT_VARIANT_COLUMNS: VariantColumn[] = [
  {
    key: 'variant_name',
    label: VARIANT_GROUP_1_FALLBACK_LABEL,
  },
  {
    key: 'amount',
    label: 'Price',
  },
  {
    key: 'stock',
    label: 'Stock',
  },
  {
    key: 'sku',
    label: 'SKU',
  },
];
