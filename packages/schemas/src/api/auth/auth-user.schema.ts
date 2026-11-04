import { z } from 'zod'
import {
  MarketCurrencies,
  MarketLanguages,
  MarketRegions,
} from '@arc/enums/market'

/**
 * Runtime schema for user market preferences.
 *
 * Request and response types are derived from the generated OpenAPI contract
 * (`UserPreferencesDto`, `MePreferencesResponseDto`). This schema is kept as
 * the runtime validator for user-supplied preference values, which no
 * generated type can check at runtime.
 */
export const authPreferencesSchema = z.object({
  region: z.nativeEnum(MarketRegions),
  language: z.nativeEnum(MarketLanguages),
  currency: z.nativeEnum(MarketCurrencies),
})
