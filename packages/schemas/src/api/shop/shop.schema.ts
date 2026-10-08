import { MarketCurrencies } from '@arc/enums/market'
import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const myShopResponseSchema = z.object({
  id: idSchema,
  owner_user_id: z.string(),
  shop_name: z.string(),
  slug: z.string(),
  status: z.string(),
  currency: z.nativeEnum(MarketCurrencies),
  timezone: z.string(),
})

export const updateShopSettingsRequestSchema = z.object({
  timezone: z.string().min(1),
})

export const createShopRequestSchema = z.object({
  shop_name: z.string(),
  currency: z.nativeEnum(MarketCurrencies),
})
