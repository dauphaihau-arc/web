import type { z } from 'zod';
import type {
  updateProductRequestBodySchema,
  updateProductRequestSchema,
} from '~/domains/shop/api/schemas/product/update-product.schema';
import type { DetailShopProductResponse } from './read.contract';

export type ProductMutationVersionBody = {
  product_version: number
  idempotency_key: string
};

export type UpdateProductRequestBody = z.infer<typeof updateProductRequestBodySchema>;
export type UpdateProductDetailsRequestBody = UpdateProductRequestBody & ProductMutationVersionBody;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type UpdateProductResponse = DetailShopProductResponse;


export type SetProductImagesByKeysRequestBody = {
  product_version?: number
  idempotency_key: string
  images: Array<{
    storage_key: string
    rank: number
  }>
};

export type SetProductAttributesRequestBody = ProductMutationVersionBody & {
  attributes: Array<{
    category_attribute_id: string
    selected_option_id?: string
    selected_text?: string
  }>
};
