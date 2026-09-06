/* eslint-disable @typescript-eslint/naming-convention */
import type { ProductVariantTypes } from '@arc/enums/product';

export type VariantEditorSubmission = {
  variantType: ProductVariantTypes.SINGLE | ProductVariantTypes.COMBINE
  rows: Array<{
    optionValue1: string
    optionValue2?: string
    amount: number
    stock: number
    sku?: string
  }>
};

export type IOnChangeUpdateVariants = {
  variant_type: ProductVariantTypes.SINGLE | ProductVariantTypes.COMBINE
  variant_group_name: string
  variant_sub_group_name?: string
  variantSubmission: VariantEditorSubmission
} | null;
