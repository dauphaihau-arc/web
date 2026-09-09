export const ADD_OPTIONS_LABEL = 'Add options';
export const REMOVE_OPTIONS_LABEL = 'Remove options';
export const ADD_ANOTHER_OPTION_LABEL = 'Add another option';
export const OPTION_NAME_LABEL = 'Option name';
export const ADD_OPTION_VALUE_LABEL = 'Add option value';

export const REQUIRED_ERROR = 'Required';
export const DUPLICATE_ERROR = 'Duplicate';
export const REQUIRED_VARIANT_ERROR = 'Required at least 1 variant';

export const VARIANT_GROUP_1_FALLBACK_LABEL = 'Variant';
export const VARIANT_GROUP_2_FALLBACK_LABEL = 'Variant';

export const VARIANT_INVENTORY_COLUMNS = [
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
] as const;
