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
  variantsCurrent: Map<string, string>
} & Record<'variants' | 'subVariants', UpdateVariantOption[]> & {
  variant_group_name?: string
  variant_sub_group_name?: string
};

export type UpdateVariantTable = {
  id: number
  inventoryId?: string | null
  subVariantId?: string | null
  sub_variant_name?: string
  errorAmount: string
  errorStock: string
  isUpdated?: boolean
  amount?: number
  stock?: number
  sku?: string
  variant_name?: string
};
