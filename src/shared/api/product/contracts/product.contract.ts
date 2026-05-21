import type { z } from 'zod';
import type {
  getDetailProductBySlugResponseSchema,
  getProductsRequestSchema,
  getProductsResponseItemSchema,
  getProductsResponseSchema
} from '~/shared/schemas/api/product/product.schema';

export type GetProductsRequest = z.infer<typeof getProductsRequestSchema>;
export type GetProductsResponseItem = z.infer<typeof getProductsResponseItemSchema>;
export type GetProductsResponse = z.infer<typeof getProductsResponseSchema>;
export type GetDetailProductBySlugResponse = z.infer<typeof getDetailProductBySlugResponseSchema>;
