import type { z } from 'zod';
import type {
  createDraftProductRequestAttributeSchema,
  createDraftProductRequestImageSchema,
  createDraftProductRequestInventorySchema,
  createDraftProductRequestSchema,
  createDraftProductRequestShippingSchema,
  createDraftProductRequestVariantSchema,
  createDraftProductResponseSchema
} from '~/shared/schemas/api/shop/product/create-draft.schema';

export type CreateDraftProductRequestImage = z.infer<typeof createDraftProductRequestImageSchema>;
export type CreateDraftProductRequestAttribute = z.infer<typeof createDraftProductRequestAttributeSchema>;
export type CreateDraftProductRequestVariant = z.infer<typeof createDraftProductRequestVariantSchema>;
export type CreateDraftProductRequestInventory = z.infer<typeof createDraftProductRequestInventorySchema>;
export type CreateDraftProductRequestShipping = z.infer<typeof createDraftProductRequestShippingSchema>;
export type CreateDraftProductRequest = z.infer<typeof createDraftProductRequestSchema>;
export type CreateDraftProductResponse = z.infer<typeof createDraftProductResponseSchema>;
