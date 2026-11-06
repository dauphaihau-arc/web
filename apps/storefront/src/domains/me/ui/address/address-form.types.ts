import type { CreateUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract';

/**
 * Shared field set for creating an address. A guest address is the same shape
 * plus a contact email and without the default-address flag.
 *
 * `country`/`state` are local display labels for the picker and legacy rows;
 * they stay in form state for the UI and are never written to the API.
 */
export type AddressFormState = Partial<CreateUserAddressRequest> & {
  country?: string
  state?: string
  email?: string
};
