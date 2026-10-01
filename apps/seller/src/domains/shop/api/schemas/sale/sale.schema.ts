import { z } from 'zod';
import { idSchema } from '@arc/schemas/primitives/id.schema';
import { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion';

export const shopSaleSchema = z.object({
  id: idSchema,
  shop: idSchema,
  name: z.string(),
  percent_off: z.number().int(),
  product_scope: z.nativeEnum(PromotionProductScope),
  product_ids: z.array(idSchema),
  currency: z.string(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  timezone: z.string(),
  status: z.nativeEnum(PromotionStatus),
  cancelled_at: z.coerce.date().nullable().optional(),
  ended_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createShopSaleRequestSchema = z.object({
  name: z.string().min(1).max(255),
  percent_off: z.number().int().min(1).max(99),
  product_scope: z.nativeEnum(PromotionProductScope),
  product_ids: z.array(idSchema).optional(),
  timezone: z.string().min(1),
  start_now: z.boolean().optional(),
  start_local: z.string().optional(),
  start_offset_minutes: z.number().int().optional(),
  end_local: z.string(),
  end_offset_minutes: z.number().int().optional(),
});

export const createShopSaleResponseSchema = z.object({
  sale: shopSaleSchema,
});

export const listShopSalesRequestSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const listShopSalesResponseSchema = z.object({
  results: z.array(shopSaleSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total_pages: z.number().int(),
  total_results: z.number().int(),
});

export const shopSaleStopResponseSchema = z.object({
  sale: shopSaleSchema,
});

export const bulkStopShopSalesRequestSchema = z.object({
  ids: z.array(idSchema),
});

export const bulkStopShopSalesResponseSchema = z.object({
  results: z.array(shopSaleSchema),
  succeeded_ids: z.array(idSchema),
  failed: z.array(z.object({
    id: idSchema,
    code: z.string(),
    reason: z.string(),
  })),
});
