import type { UserAddress } from '~/shared/models/user-address';
import type { z } from 'zod';
import type { ResponseBaseGetList } from '~/shared/contracts/common';
import type { createUserAddressSchema } from '~/shared/schemas/user-address.schema';

export type GetUserAddressesResponse = ResponseBaseGetList<UserAddress>;

export type CreateUserAddressRequest = z.infer<typeof createUserAddressSchema>;
export type CreateUserAddressResponse = {
  address: UserAddress
};

export type UpdateUserAddressRequest = Partial<UserAddress>;
export type UpdateUserAddressResponse = {
  address: UserAddress
};

export type DeleteUserAddressRequest = {
  id: UserAddress['id']
};
