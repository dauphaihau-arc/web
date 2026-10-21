import type { z } from 'zod';
import type {
  shopFinancePayoutSettingsSchema,
  updateShopFinancePayoutSettingsRequestSchema,
} from '@arc/schemas/api/shop/finance/payout-settings.schema';

export type ShopFinancePayoutSettings = z.infer<typeof shopFinancePayoutSettingsSchema>;
export type UpdateShopFinancePayoutSettingsRequest = z.infer<
  typeof updateShopFinancePayoutSettingsRequestSchema
>;
