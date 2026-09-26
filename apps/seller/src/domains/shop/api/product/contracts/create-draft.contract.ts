import type { z } from 'zod';
import type {
  createDraftProductRequestAttributeSchema,
  createDraftProductRequestImageSchema,
  createDraftProductRequestInventorySchema,
  createDraftProductRequestPricingSchema,
  createDraftProductRequestSchema,
  createDraftProductRequestVariantSchema,
  createDraftProductResponseSchema,
  createDraftProductResponseShippingSchema,
} from '~/domains/shop/api/schemas/product/create-draft.schema';

export type CreateDraftProductRequestImage = z.infer<typeof createDraftProductRequestImageSchema>;
export type CreateDraftProductRequestAttribute = z.infer<typeof createDraftProductRequestAttributeSchema>;
export type CreateDraftProductRequestVariant = z.infer<typeof createDraftProductRequestVariantSchema>;
export type CreateDraftProductRequestInventory = z.infer<typeof createDraftProductRequestInventorySchema>;
export type CreateDraftProductRequestPricing = z.infer<typeof createDraftProductRequestPricingSchema>;
export type CreateDraftProductResponseShipping = z.infer<typeof createDraftProductResponseShippingSchema>;
export type CreateDraftProductRequest = z.infer<typeof createDraftProductRequestSchema>;
export type CreateDraftProductResponse = z.infer<typeof createDraftProductResponseSchema>;
