/* eslint-disable @typescript-eslint/naming-convention */
export type VariantOption = {
  id: number | string
  variant_name: string
  errorMsg: string
};

export type InventoryFields = {
  amount?: number
  stock?: number
  sku?: string
};

export type VariantFields = {
  variant_name?: string
};

export type VariantInputState = {
  isActiveSubVariant: boolean
  variantOption: string
  subVariantOption: string
  errorVariantOption: string
  errorSubVariantOption: string
  errorVariantGroupName: string
  errorVariantSubGroupName: string
  variant_group_name?: string
  variant_sub_group_name?: string
} & Record<'variants' | 'subVariants', VariantOption[]>;

export type VariantTable = {
  id: number
  sub_variant_name?: string
  errorAmount: string
  errorStock: string
} & InventoryFields & VariantFields;

export type VariantColumn = {
  key: string
  label: string
};
