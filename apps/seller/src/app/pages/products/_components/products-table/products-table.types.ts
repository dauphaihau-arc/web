import type { ProductStates } from '@arc/enums/product';
import type { ListShopProductsItem } from '~/domains/shop/api/product/contracts/read.contract';

export type ProductRow = {
  id: string
  slug: string
  title: string
  state?: ProductStates
  imageUrl?: string
  variants: ListShopProductsItem['variants']
  options: ListShopProductsItem['options']
  inventory: ListShopProductsItem['inventory']
  hasOptions: boolean
};

export type ProductVariantRow = ProductRow['variants'][number];

/** Columns rendered as one line per inventory entry. */
export type ProductInventoryField = 'sku' | 'variant' | 'price' | 'stock';

export type PublishFailureSummary = {
  id: string
  title: string
  reason: string
};

export type PublishFeedback = {
  title: string
  description: string
  reasonSummaries: string[]
  failedProducts: PublishFailureSummary[]
};
