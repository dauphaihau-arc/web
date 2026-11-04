import { z } from 'zod'
import {
  MarketCurrencies,
  MarketLanguages,
  MarketRegions,
} from '@arc/enums/market'

/**
 * Runtime schema for user market preferences.
 *
 * The auth API contract types live in each app's auth-user contract, derived
 * from the generated OpenAPI types. This schema is kept because the register
 * and update-me request schemas build on it at runtime.
 */
export const authPreferencesSchema = z.object({
  region: z.nativeEnum(MarketRegions),
  language: z.nativeEnum(MarketLanguages),
  currency: z.nativeEnum(MarketCurrencies),
})
