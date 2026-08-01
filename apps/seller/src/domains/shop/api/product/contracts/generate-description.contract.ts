import type { z } from 'zod';
import type {
  generateProductDescriptionRequestAttributeSchema,
  generateProductDescriptionRequestSchema,
  generateProductDescriptionResponseSchema
} from '~/domains/shop/api/schemas/product/generate-description.schema';

export type GenerateProductDescriptionRequestAttribute = z.infer<
  typeof generateProductDescriptionRequestAttributeSchema
>;
export type GenerateProductDescriptionRequest = z.infer<
  typeof generateProductDescriptionRequestSchema
>;
export type GenerateProductDescriptionResponse = z.infer<
  typeof generateProductDescriptionResponseSchema
>;
