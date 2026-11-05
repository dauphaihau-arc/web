import type { components, paths } from '@arc/schemas/api/generated/openapi';

export type ShippingProfileResource = components['schemas']['ShippingProfileResponseDto'];
export type ShippingProfileListResponse = components['schemas']['ShippingProfileListResponseDto'];
export type ShippingRatePreviewResource = components['schemas']['ShippingRatePreviewResponseDto'];
export type ShippingRateInput = components['schemas']['ShippingRateDto'];

export type ListShippingProfilesRequest =
  paths['/v1/shops/{shop_id}/shipping-profiles']['get']['parameters']['query'];

export type CreateShippingProfileRequestBody =
  components['schemas']['CreateShippingProfileDto'] & {
    /** Sent as the `Idempotency-Key` header, not in the body. */
    idempotency_key: string
  };

export type UpdateShippingProfileRequestBody =
  components['schemas']['UpdateShippingProfileDto'] & {
    /** Sent as the `Idempotency-Key` header, not in the body. */
    idempotency_key: string
  };

export type PreviewShippingProfileRequestBody =
  components['schemas']['PreviewShippingProfileDto'];
