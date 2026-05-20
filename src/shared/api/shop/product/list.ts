import type { Product } from '~/shared/models/product';
import type { RequestGetListParams } from '~/shared/types/common';
import type { ProductVariantTypes } from '~/shared/config/enums/product';

export type ListShopProductsRequest = Partial<Pick<Product, 'title'> & RequestGetListParams>;

export type ListShopProductsItem = {
  id: string
  slug: string
  title: string
  variantType?: ProductVariantTypes
  images: {
    id: string
    storageKey: string
    url?: string
    rank: number
  }[]
  variants: {
    id: string
    name: string
    optionValue1?: string
    optionValue2?: string
    imageStorageKey?: string
    rank: number
  }[]
  inventory: {
    id: string
    productVariantId?: string
    sku?: string
    stock: number
    price: number
    salePrice?: number
  }[]
};

export type ListShopProductsResponseMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
};

export type ListShopProductsResponse = {
  items: ListShopProductsItem[]
  meta: ListShopProductsResponseMeta
};
