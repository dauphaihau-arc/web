import type { UserAddress } from '~/shared/models/user-address';
import type { ResponseBaseGetList } from '~/shared/types/common';
import type { CreateBodyUserAddressBody } from '~/shared/types/user-address';

export type GetUserAddressesResponse = ResponseBaseGetList<UserAddress>;

export type CreateUserAddressRequest = CreateBodyUserAddressBody;
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
