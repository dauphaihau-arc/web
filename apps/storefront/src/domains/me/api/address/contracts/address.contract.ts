import type { components } from '@arc/schemas/api/generated/openapi';

type GeneratedUserAddressItem = components['schemas']['MyAddressResponseDto'];
type GeneratedCreateUserAddressRequest = components['schemas']['CreateMyAddressDto'];
type GeneratedUpdateUserAddressBody = components['schemas']['UpdateMyAddressDto'];

/**
 * The saved-address API is expanding to canonical location codes. These fields
 * are hand-written here until the api-spec publishes them in the generated
 * contract; `country`/`state` remain the display-name fields and are still
 * accepted as a fallback while the endpoint expands.
 */
type CodedAddressFields = {
  country?: string
  country_code?: string
  state?: string
  state_code?: string
  state_text?: string
};

export type UserAddressItem = GeneratedUserAddressItem & {
  country_code: string | null
  state_code: string | null
};

export type GetUserAddressesResponse = Omit<
  components['schemas']['MyAddressListResponseDto'],
  'results'
> & {
  results: UserAddressItem[]
};

export type CreateUserAddressRequest = Omit<
  GeneratedCreateUserAddressRequest,
  'country' | 'state'
> & CodedAddressFields;

export type CreateUserAddressResponse = Omit<
  components['schemas']['MyAddressEnvelopeResponseDto'],
  'address'
> & {
  address: UserAddressItem
};

export type UpdateUserAddressBody = Omit<
  GeneratedUpdateUserAddressBody,
  'country' | 'state'
> & CodedAddressFields;

export type UpdateUserAddressRequest = UpdateUserAddressBody & { id: UserAddressItem['id'] };
export type UpdateUserAddressResponse = CreateUserAddressResponse;
export type DeleteUserAddressRequest = {
  id: UserAddressItem['id']
};
