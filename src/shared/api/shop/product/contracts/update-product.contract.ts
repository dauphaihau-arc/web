import type { z } from 'zod';
import type {
  updateProductRequestBodySchema,
  updateProductRequestSchema
} from '~/shared/schemas/api/shop/product/update-product.schema';

export type UpdateProductRequestBody = z.infer<typeof updateProductRequestBodySchema>;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type UpdateProductResponse = undefined;
