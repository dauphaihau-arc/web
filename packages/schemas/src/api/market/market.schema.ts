import { z } from 'zod'
import { MarketCurrencies, MarketRegions } from '@arc/enums/market'

export const exchangeRatesResponseSchema = z.object({
  rates: z.record(z.string(), z.number()),
  time_next_update_unix: z.number(),
})

export const ipDataResponseSchema = z.object({
  emoji_flag: z.string(),
  region: z.string(),
  city: z.string(),
  country_name: z.nativeEnum(MarketRegions),
  currency: z.object({
    code: z.nativeEnum(MarketCurrencies),
  }),
})
