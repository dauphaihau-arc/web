import { z } from 'zod'
import { MarketCurrencies, MarketRegions } from '@arc/enums/market'

export const ipDataResponseSchema = z.object({
  emoji_flag: z.string(),
  region: z.string(),
  city: z.string(),
  country_name: z.nativeEnum(MarketRegions),
  currency: z.object({
    code: z.nativeEnum(MarketCurrencies),
  }),
})
