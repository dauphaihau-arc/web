import type { z } from 'zod';
import type { components } from '@arc/schemas/api/generated/openapi';
import type {
  listShopProductsRequestSchema,
  listShopProductsItemSchema,
  listShopProductsResponseSchema,
  detailShopProductInventorySchema,
  detailShopProductResponseSchema,
  detailShopProductVariantOptionSchema,
  detailShopProductVariantSchema,
  issueProductImageUploadUrlRequestSchema,
  shopProductDetailApiResponseSchema,
  shopProductShippingApiSchema,
  bulkMutateShopProductsRequestSchema,
} from '~/domains/shop/api/schemas/product/read-product.schema';

export type ListShopProductsRequest = z.infer<typeof listShopProductsRequestSchema>;
export type ListShopProductsItem = z.infer<typeof listShopProductsItemSchema>;
export type ListShopProductsResponse = z.infer<typeof listShopProductsResponseSchema>;

export type ShopProductDetailApiResponse = z.infer<typeof shopProductDetailApiResponseSchema>;
export type ShopProductShipping = z.infer<typeof shopProductShippingApiSchema>;
export type DetailShopProductInventory = z.infer<typeof detailShopProductInventorySchema>;
export type DetailShopProductVariantOption = z.infer<typeof detailShopProductVariantOptionSchema>;
export type DetailShopProductVariant = z.infer<typeof detailShopProductVariantSchema>;
export type DetailShopProductResponse = z.infer<typeof detailShopProductResponseSchema>;

/**
 * The upload target carries the `productId` path segment alongside the
 * snake_case wire body, which the contract does not model as one payload.
 */
export type IssueProductImageUploadUrlRequest = z.infer<typeof issueProductImageUploadUrlRequestSchema>;
export type IssueProductImageUploadUrlResponse = components['schemas']['ProductImageUploadUrlResponseDto'];
export type BulkMutateShopProductsAction = components['schemas']['BulkMutateShopProductsDto']['action'];
export type BulkMutateShopProductsRequest = z.infer<typeof bulkMutateShopProductsRequestSchema>;
export type BulkMutateShopProductsResponse = components['schemas']['ShopProductBulkMutateResponseDto'];
