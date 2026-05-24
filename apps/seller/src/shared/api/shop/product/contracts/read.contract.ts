import type { z } from 'zod'
import type {
  detailShopProductInventorySchema,
  detailShopProductResponseSchema,
  detailShopProductVariantOptionSchema,
  detailShopProductVariantSchema,
  issueProductImageUploadUrlRequestSchema,
  issueProductImageUploadUrlResponseSchema,
  listShopProductsItemSchema,
  listShopProductsRequestSchema,
  listShopProductsResponseSchema,
  removeProductRequestSchema,
  shopProductDetailApiResponseSchema,
} from '~/shared/schemas/api/shop/product/read-product.schema'

export type ListShopProductsRequest = z.infer<typeof listShopProductsRequestSchema>
export type ListShopProductsItem = z.infer<typeof listShopProductsItemSchema>
export type ListShopProductsResponse = z.infer<typeof listShopProductsResponseSchema>

export type ShopProductDetailApiResponse = z.infer<typeof shopProductDetailApiResponseSchema>
export type DetailShopProductInventory = z.infer<typeof detailShopProductInventorySchema>
export type DetailShopProductVariantOption = z.infer<typeof detailShopProductVariantOptionSchema>
export type DetailShopProductVariant = z.infer<typeof detailShopProductVariantSchema>
export type DetailShopProductResponse = z.infer<typeof detailShopProductResponseSchema>

export type IssueProductImageUploadUrlRequest = z.infer<typeof issueProductImageUploadUrlRequestSchema>
export type IssueProductImageUploadUrlResponse = z.infer<typeof issueProductImageUploadUrlResponseSchema>
export type RemoveProductRequest = z.infer<typeof removeProductRequestSchema>
export type RemoveProductResponse = undefined
