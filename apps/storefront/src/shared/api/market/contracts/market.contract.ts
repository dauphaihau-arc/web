import type { z } from 'zod'
import type {
  exchangeRatesResponseSchema,
  ipDataResponseSchema,
} from '@arc/schemas/api/market/market.schema'

export type ExchangeRatesResponse = z.infer<typeof exchangeRatesResponseSchema>
export type IpDataResponse = z.infer<typeof ipDataResponseSchema>
