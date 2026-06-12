import type { z } from 'zod';
import type {
  marketConfigMarketSchema,
  marketConfigResponseSchema,
  ipDataResponseSchema
} from '@arc/schemas/api/market/market.schema';

export type IpDataResponse = z.infer<typeof ipDataResponseSchema>;
export type MarketConfigMarket = z.infer<typeof marketConfigMarketSchema>;
export type MarketConfigResponse = z.infer<typeof marketConfigResponseSchema>;
