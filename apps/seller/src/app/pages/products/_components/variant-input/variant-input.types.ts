/* eslint-disable @typescript-eslint/naming-convention */
export type VariantInputOption = {
  id: number | string
  variant_name: string
  errorMsg: string
};

export type VariantInputColumn = {
  key: string
  label: string
};

export type VariantInputTableRow = {
  id: number
  variant_name?: string
  sub_variant_name?: string
  amount?: number
  stock?: number
  sku?: string
  errorAmount: string
  errorStock: string
};
