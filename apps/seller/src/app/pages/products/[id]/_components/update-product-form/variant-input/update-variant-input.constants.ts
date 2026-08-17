import type { UpdateVariantTable } from './update-variant-input.types';

export const VARIANT_GROUP_1_FALLBACK_LABEL = 'Group variant 1';
export const VARIANT_GROUP_2_FALLBACK_LABEL = 'Group variant 2';
export const REQUIRED_ERROR = 'Required';
export const DUPLICATE_ERROR = 'Duplicate';
export const REQUIRED_VARIANT_ERROR = 'Required at least 1 variant';

export const DEFAULT_UPDATE_VARIANT_TABLE: UpdateVariantTable = {
  id: 1,
  variant_name: '',
  amount: undefined,
  stock: 0,
  sku: '',
  errorAmount: '',
  errorStock: '',
  inventoryId: null,
  isUpdated: false,
};

export const DEFAULT_UPDATE_VARIANT_COLUMNS = [
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
