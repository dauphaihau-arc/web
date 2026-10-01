import type { z } from 'zod';
import type {
  createShopRequestSchema,
  myShopResponseSchema,
  updateShopSettingsRequestSchema,
} from '@arc/schemas/api/shop/shop.schema';

export type MyShopResponse = z.infer<typeof myShopResponseSchema>;
export type CreateShopRequest = z.infer<typeof createShopRequestSchema>;
export type CreateShopResponse = MyShopResponse;
export type UpdateShopSettingsRequest = z.infer<typeof updateShopSettingsRequestSchema>;
