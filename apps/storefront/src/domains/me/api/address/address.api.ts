import type {
  CreateUserAddressRequest,
  CreateUserAddressResponse,
  DeleteUserAddressRequest,
  GetUserAddressesResponse,
  UpdateUserAddressRequest,
  UpdateUserAddressResponse
} from './contracts/address.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meAddressApi = {
  create(payload: CreateUserAddressRequest) {
    return apiClient.post<CreateUserAddressResponse>(
      '/me/addresses',
      payload
    );
  },

  delete(id: DeleteUserAddressRequest['id']) {
    return apiClient.delete(
      `/me/addresses/${id}`
    );
  },

  getList() {
    return apiClient.get<GetUserAddressesResponse>(
      '/me/addresses'
    );
  },

  update(payload: UpdateUserAddressRequest) {
    const { id, ...body } = payload;
    return apiClient.patch<UpdateUserAddressResponse>(
      `/me/addresses/${id}`,
      body
    );
  },
};
