import {
  DUPLICATE_ERROR,
  REQUIRED_ERROR,
  REQUIRED_VARIANT_ERROR,
  VARIANT_GROUP_1_FALLBACK_LABEL,
  VARIANT_GROUP_2_FALLBACK_LABEL,
  VARIANT_INVENTORY_COLUMNS,
} from '~/app/pages/products/_components/variant-input/variant-input.constants';
import type { VariantColumn, VariantTable } from './variant-input.types';

export {
  DUPLICATE_ERROR,
  REQUIRED_ERROR,
  REQUIRED_VARIANT_ERROR,
  VARIANT_GROUP_1_FALLBACK_LABEL,
  VARIANT_GROUP_2_FALLBACK_LABEL,
};

export const DEFAULT_VARIANT_TABLE: VariantTable = {
  id: 1,
  variant_name: '',
  amount: undefined,
  stock: 0,
  sku: '',
  errorAmount: '',
  errorStock: '',
};

export const DEFAULT_VARIANT_COLUMNS: VariantColumn[] = [...VARIANT_INVENTORY_COLUMNS];
