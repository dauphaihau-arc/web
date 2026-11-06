import type { components } from '@arc/schemas/api/generated/openapi';

type GeneratedUserAddressItem = components['schemas']['MyAddressResponseDto'];
type GeneratedCreateUserAddressRequest = components['schemas']['CreateMyAddressDto'];
type GeneratedUpdateUserAddressBody = components['schemas']['UpdateMyAddressDto'];

/**
 * The saved-address API writes canonical location codes. These fields are
 * hand-written here until the api-spec publishes them in the generated
 * contract; `country_code` is the required write identity and `state_code` /
 * `state_text` carry the subdivision. Display names are response-only and are
 * never accepted as input.
 */
type CodedAddressFields = {
  country_code: string
  state_code?: string
  state_text?: string
};

type OptionalCodedAddressFields = Partial<CodedAddressFields>;

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
> & OptionalCodedAddressFields;

export type UpdateUserAddressRequest = UpdateUserAddressBody & { id: UserAddressItem['id'] };
export type UpdateUserAddressResponse = CreateUserAddressResponse;
export type DeleteUserAddressRequest = {
  id: UserAddressItem['id']
};
