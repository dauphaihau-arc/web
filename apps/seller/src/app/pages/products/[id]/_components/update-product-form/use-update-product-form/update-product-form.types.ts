/* eslint-disable @typescript-eslint/naming-convention */
import type { ProductVariantTypes } from '@arc/enums/product';

export type VariantEditorSubmission = {
  variantType: ProductVariantTypes.SINGLE | ProductVariantTypes.COMBINE
  variantGroupName?: string
  variantSubGroupName?: string
  rows: Array<{
    optionValue1: string
    optionValue2?: string
    productVariantId?: string
    inventoryId?: string
    optionId1?: string
    optionValueId1?: string
    optionId2?: string
    optionValueId2?: string
    onHandVersion?: number
    lifecycleState?: 'active' | 'inactive'
    amount: number
    stock: number
    sku?: string
    currency?: string
  }>
};

export type IOnChangeUpdateVariants = {
  variant_type: ProductVariantTypes.SINGLE | ProductVariantTypes.COMBINE
  variant_group_name: string
  variant_sub_group_name?: string
  variantSubmission: VariantEditorSubmission
} | null;
