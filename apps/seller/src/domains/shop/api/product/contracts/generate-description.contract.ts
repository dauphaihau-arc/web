import type { z } from 'zod';
import type { components } from '@arc/schemas/api/generated/openapi';
import type {
  generateProductDescriptionRequestSchema,
} from '~/domains/shop/api/schemas/product/generate-description.schema';

export type GenerateProductDescriptionRequestAttribute = components['schemas']['GenerateProductDescriptionAttributeDto'];
/**
 * The request adds `variant_type`, which the contract's description payload
 * does not model, so the request stays modelled by the local schema.
 */
export type GenerateProductDescriptionRequest = z.infer<
  typeof generateProductDescriptionRequestSchema
>;
export type GenerateProductDescriptionResponse = components['schemas']['GenerateProductDescriptionResponseDto'];
