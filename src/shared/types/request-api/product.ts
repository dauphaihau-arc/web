import type { Category } from '~/shared/types/category';
import type { RequestGetListParams } from '~/shared/types/common';

// region get products
export type GetProductsParams = Partial<{
  categoryId: Category['id']
  shopId: string
  search: string
  title: string
  isDigital: boolean
  whoMade: string
  order: string
}> & RequestGetListParams;

export type ResponseGetProductsProduct = {
  id: string
  shop: {
    id: string
    publicId?: string
    shopName: string
  }
  categoryId?: Category['id']
  title: string
  slug: string
  image?: {
    storageKey: string
    url?: string
  }
  variantType?: string
  inventory?: {
    price: number
    salePrice?: number
    stock: number
    sku?: string
  }
  createdAt: string | Date
};

export type ResponseGetProducts = {
  items: ResponseGetProductsProduct[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
};
// endregion

export type ResponseGetDetailProduct = {
  id: string
  shop: {
    id: string
    publicId?: string
    shopName: string
  }
  categoryId?: Category['id']
  title: string
  slug: string
  description: string
  whoMade: string
  isDigital: boolean
  variantType?: string
  variantGroupName?: string
  variantSubGroupName?: string
  images: Array<{
    id: string
    storageKey: string
    url?: string
    rank: number
  }>
  variants: Array<{
    id: string
    name: string
    optionValue1?: string
    optionValue2?: string
    imageStorageKey?: string
    rank: number
  }>
  inventory: Array<{
    id: string
    productVariantId?: string
    sku?: string
    stock: number
    price: number
    salePrice?: number
  }>
  shipping?: {
    originCountry: string
    processTimeLabel: string
    destinations: Array<{
      id: string
      countryCode: string
      deliveryTimeLabel: string
      service: string
      chargeType: string
      rank: number
    }>
  }
};
