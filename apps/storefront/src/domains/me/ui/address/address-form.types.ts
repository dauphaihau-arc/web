import type { CreateUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract';

/**
 * Shared field set for creating an address. A guest address is the same shape
 * plus a contact email and without the default-address flag.
 */
export type AddressFormState = Partial<CreateUserAddressRequest> & {
  email?: string
};
