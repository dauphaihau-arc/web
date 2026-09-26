import type { z } from 'zod';
import type { ShippingProfileStatus } from '@arc/enums/shipping';
import type {
  shippingProfileSchema,
  shippingProfileListSchema,
  shippingRatePreviewSchema,
  shippingRateInputSchema,
} from '@arc/schemas/shipping-profile.schema';

export type ShippingProfileResource = z.infer<typeof shippingProfileSchema>;
export type ShippingProfileListResponse = z.infer<typeof shippingProfileListSchema>;
export type ShippingRatePreviewResource = z.infer<typeof shippingRatePreviewSchema>;
export type ShippingRateInput = z.infer<typeof shippingRateInputSchema>;

export type ListShippingProfilesRequest = {
  page: number
  limit: number
  /**
   * Lifecycle states to list. Archived profiles are only listed when asked for,
   * so the settings table can keep them behind their own view.
   */
  status?: ShippingProfileStatus[]
};

export type CreateShippingProfileRequestBody = {
  idempotency_key: string
  name: string
  status?: 'draft' | 'active'
  ship_from_country?: string
  ship_from_postal?: string
  processing_time_min_days?: number
  processing_time_max_days?: number
  rates?: ShippingRateInput[]
};

export type UpdateShippingProfileRequestBody = {
  idempotency_key: string
  version: number
  name?: string
  status?: 'draft' | 'active'
  ship_from_country?: string | null
  ship_from_postal?: string | null
  processing_time_min_days?: number | null
  processing_time_max_days?: number | null
  rates?: ShippingRateInput[]
};

export type PreviewShippingProfileRequestBody = {
  country_code: string
  quantity: number
};
