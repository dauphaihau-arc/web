import type { z } from 'zod';
import type {
  updateProductRequestBodySchema,
  updateProductRequestSchema
} from '~/domains/shop/api/schemas/product/update-product.schema';

export type UpdateProductRequestBody = z.infer<typeof updateProductRequestBodySchema>;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type UpdateProductResponse = undefined;
