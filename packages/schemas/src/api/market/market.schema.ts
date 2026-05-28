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

export const marketConfigMarketSchema = z.object({
  code: z.string(),
  name: z.nativeEnum(MarketRegions),
  defaultCurrency: z.nativeEnum(MarketCurrencies),
  supportedCurrencies: z.array(z.nativeEnum(MarketCurrencies)),
  defaultLocale: z.string(),
  supportedLocales: z.array(z.string()),
  enabled: z.boolean(),
})

export const marketConfigResponseSchema = z.object({
  markets: z.array(marketConfigMarketSchema),
})
