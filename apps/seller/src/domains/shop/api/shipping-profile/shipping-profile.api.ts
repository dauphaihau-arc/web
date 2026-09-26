import type {
  CreateShippingProfileRequestBody,
  ListShippingProfilesRequest,
  PreviewShippingProfileRequestBody,
  ShippingProfileListResponse,
  ShippingProfileResource,
  ShippingRatePreviewResource,
  UpdateShippingProfileRequestBody,
} from './contracts/shipping-profile.contract';
import { apiClient } from '~/domains/_shared/api-client';

type ShippingProfileMutationBody = {
  idempotency_key: string
};

function splitIdempotency<TBody extends ShippingProfileMutationBody>(payload: TBody) {
  const {
    idempotency_key: idempotencyKey,
    ...body
  } = payload;

  return {
    body,
    options: {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  };
}

export const shopShippingProfileApi = {
  list(shopId: string, query?: ListShippingProfilesRequest) {
    return apiClient.get<ShippingProfileListResponse>(
      `/shops/${shopId}/shipping-profiles`,
      query,
    );
  },

  detail(shopId: string, shippingProfileId: string) {
    return apiClient.get<ShippingProfileResource>(
      `/shops/${shopId}/shipping-profiles/${shippingProfileId}`,
    );
  },

  create(shopId: string, payload: CreateShippingProfileRequestBody) {
    const { body, options } = splitIdempotency(payload);

    return apiClient.post<ShippingProfileResource>(
      `/shops/${shopId}/shipping-profiles`,
      body,
      options,
    );
  },

  update(
    shopId: string,
    shippingProfileId: string,
    payload: UpdateShippingProfileRequestBody,
  ) {
    const { body, options } = splitIdempotency(payload);

    return apiClient.patch<ShippingProfileResource>(
      `/shops/${shopId}/shipping-profiles/${shippingProfileId}`,
      body,
      options,
    );
  },

  archive(shopId: string, shippingProfileId: string, idempotencyKey: string) {
    return apiClient.post<ShippingProfileResource>(
      `/shops/${shopId}/shipping-profiles/${shippingProfileId}/archive`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
    );
  },

  /**
   * Designating the shop default is a dedication, not a configuration edit, so
   * it is naturally idempotent and carries no idempotency key.
   */
  setDefault(shopId: string, shippingProfileId: string) {
    return apiClient.put<ShippingProfileResource>(
      `/shops/${shopId}/shipping-profiles/${shippingProfileId}/default`,
    );
  },

  clearDefault(shopId: string, shippingProfileId: string) {
    return apiClient.delete<ShippingProfileResource>(
      `/shops/${shopId}/shipping-profiles/${shippingProfileId}/default`,
    );
  },

  preview(
    shopId: string,
    shippingProfileId: string,
    payload: PreviewShippingProfileRequestBody,
  ) {
    return apiClient.post<ShippingRatePreviewResource>(
      `/shops/${shopId}/shipping-profiles/${shippingProfileId}/preview`,
      payload,
    );
  },
};
