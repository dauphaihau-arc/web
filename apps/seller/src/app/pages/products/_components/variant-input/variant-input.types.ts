/* eslint-disable @typescript-eslint/naming-convention */
export type VariantInputOption = {
  id: number | string
  variant_name: string
  errorMsg: string
};

export type VariantInputState = {
  isActiveSubVariant: boolean
  variantOption: string
  subVariantOption: string
  errorVariantOption: string
  errorSubVariantOption: string
  errorVariantGroupName: string
  errorVariantSubGroupName: string
  variants: VariantInputOption[]
  subVariants: VariantInputOption[]
  variant_group_name?: string
  variant_sub_group_name?: string
};

export type VariantInputColumn = {
  key: string
  label: string
  class?: string
};

export type VariantInputTableRow = {
  id: number
  variant_option_id?: number | string
  sub_variant_option_id?: number | string
  variant_name?: string
  sub_variant_name?: string
  amount?: number
  stock?: number
  sku?: string
  errorAmount: string
  errorStock: string
  errorSku?: string
};
