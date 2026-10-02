import { z } from 'zod';
import { idSchema } from '@arc/schemas/primitives/id.schema';
import { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion';

export const shopPromoCodeSchema = z.object({
  id: idSchema,
  shop: idSchema,
  name: z.string(),
  code: z.string(),
  percent_off: z.number().int(),
  currency: z.string(),
  visibility: z.enum(['public', 'code_only']),
  product_scope: z.nativeEnum(PromotionProductScope),
  product_ids: z.array(idSchema),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  timezone: z.string(),
  status: z.nativeEnum(PromotionStatus),
  cancelled_at: z.coerce.date().nullable().optional(),
  ended_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createShopPromoCodeRequestSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(32),
  percent_off: z.number().int().min(1).max(99),
  visibility: z.enum(['public', 'code_only']),
  product_scope: z.nativeEnum(PromotionProductScope),
  product_ids: z.array(idSchema).optional(),
  timezone: z.string().min(1),
  start_now: z.boolean().optional(),
  start_local: z.string().optional(),
  start_offset_minutes: z.number().int().optional(),
  end_local: z.string(),
  end_offset_minutes: z.number().int().optional(),
});

export const createShopPromoCodeResponseSchema = z.object({
  promo_code: shopPromoCodeSchema,
});

export const listShopPromoCodesRequestSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const listShopPromoCodesResponseSchema = z.object({
  results: z.array(shopPromoCodeSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total_pages: z.number().int(),
  total_results: z.number().int(),
});
