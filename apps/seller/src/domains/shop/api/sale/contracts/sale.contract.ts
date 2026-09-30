import type { z } from 'zod';
import type {
  createShopSaleRequestSchema,
  createShopSaleResponseSchema,
  listShopSalesRequestSchema,
  listShopSalesResponseSchema,
  shopSaleSchema,
} from '~/domains/shop/api/schemas/sale/sale.schema';
import type { createSaleFormSchema } from '~/domains/shop/schemas/sale/create-sale-form.schema';

export type ShopSale = z.infer<typeof shopSaleSchema>;
export type CreateShopSaleRequestBody = z.infer<typeof createShopSaleRequestSchema>;
export type CreateSaleFormValues = z.infer<typeof createSaleFormSchema>;
export type CreateShopSaleResponse = z.infer<typeof createShopSaleResponseSchema>;
export type ListShopSalesRequest = z.infer<typeof listShopSalesRequestSchema>;
export type ListShopSalesResponse = z.infer<typeof listShopSalesResponseSchema>;
