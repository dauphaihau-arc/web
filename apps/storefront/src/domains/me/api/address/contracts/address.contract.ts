import type { components } from '@arc/schemas/api/generated/openapi';

export type UserAddressItem = components['schemas']['MyAddressResponseDto'];
export type GetUserAddressesResponse = components['schemas']['MyAddressListResponseDto'];
export type CreateUserAddressRequest = components['schemas']['CreateMyAddressDto'];
export type CreateUserAddressResponse = components['schemas']['MyAddressEnvelopeResponseDto'];
export type UpdateUserAddressBody = components['schemas']['UpdateMyAddressDto'];
export type UpdateUserAddressRequest = UpdateUserAddressBody & { id: UserAddressItem['id'] };
export type UpdateUserAddressResponse = CreateUserAddressResponse;
export type DeleteUserAddressRequest = {
  id: UserAddressItem['id']
};
