import type { z } from 'zod';
import type {
  bulkStopShopPromoCodesRequestSchema,
  bulkStopShopPromoCodesResponseSchema,
  createShopPromoCodeRequestSchema,
  createShopPromoCodeResponseSchema,
  listShopPromoCodesRequestSchema,
  listShopPromoCodesResponseSchema,
  shopPromoCodeSchema,
  shopPromoCodeStopResponseSchema,
} from '~/domains/shop/api/schemas/promo-code/promo-code.schema';
import type { createPromoCodeFormSchema } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

export type ShopPromoCode = z.infer<typeof shopPromoCodeSchema>;
export type CreateShopPromoCodeRequestBody = z.infer<typeof createShopPromoCodeRequestSchema>;
export type CreatePromoCodeFormValues = z.infer<typeof createPromoCodeFormSchema>;
export type CreateShopPromoCodeResponse = z.infer<typeof createShopPromoCodeResponseSchema>;
export type ListShopPromoCodesRequest = z.infer<typeof listShopPromoCodesRequestSchema>;
export type ListShopPromoCodesResponse = z.infer<typeof listShopPromoCodesResponseSchema>;
export type ShopPromoCodeStopResponse = z.infer<typeof shopPromoCodeStopResponseSchema>;
export type BulkStopShopPromoCodesRequest = z.infer<typeof bulkStopShopPromoCodesRequestSchema>;
export type BulkStopShopPromoCodesResponse = z.infer<typeof bulkStopShopPromoCodesResponseSchema>;
