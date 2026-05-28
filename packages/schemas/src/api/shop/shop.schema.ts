import { MarketCurrencies } from '@arc/enums/market'
import { z } from 'zod'

export const myShopResponseSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  shop_name: z.string(),
  slug: z.string(),
  status: z.string(),
  currency: z.nativeEnum(MarketCurrencies),
})

export const createShopRequestSchema = z.object({
  shop_name: z.string(),
  currency: z.nativeEnum(MarketCurrencies),
})
