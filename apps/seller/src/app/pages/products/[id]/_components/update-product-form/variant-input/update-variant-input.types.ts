/* eslint-disable @typescript-eslint/naming-convention */
import type {
  DetailShopProductResponse,
} from '~/domains/shop/api/product/contracts/read.contract';

export type VariantEditorProduct = DetailShopProductResponse['product'];

export type UpdateVariantOption = {
  id: number | string
  variant_name: string
  errorMsg: string
};

export type UpdateVariantInputState = {
  isActiveSubVariant: boolean
  variantOption: string
  subVariantOption: string
  errorVariantOption: string
  errorSubVariantOption: string
  errorVariantGroupName: string
  errorVariantSubGroupName: string
  variantIdsDelete: Array<number | string>
  variantsCurrent: Map<number | string, number | string>
} & Record<'variants' | 'subVariants', UpdateVariantOption[]> & {
  variant_group_name?: string
  variant_sub_group_name?: string
};

export type UpdateVariantTable = {
  id: number
  variant_option_id?: number | string
  sub_variant_option_id?: number | string
  productVariantId?: string | null
  optionId1?: string
  optionValueId1?: string
  optionId2?: string
  optionValueId2?: string
  inventoryId?: string | null
  subVariantId?: string | null
  sub_variant_name?: string
  errorAmount: string
  errorStock: string
  errorSku?: string
  isUpdated?: boolean
  amount?: number
  stock?: number
  onHandVersion?: number
  lifecycleState?: 'active' | 'inactive'
  sku?: string
  currency?: string
  sourceSku?: string
  variant_name?: string
};
