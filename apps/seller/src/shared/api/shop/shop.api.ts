import type {
  CreateShopRequest,
  CreateShopResponse,
  MyShopResponse,
} from './contracts/shop.contract'
import { apiClient } from '~/shared/lib/api-client'

export const shopApi = {
  create(payload: CreateShopRequest) {
    return apiClient.post<CreateShopResponse>(
      '/shops',
      payload,
    )
  },

  getMine() {
    return apiClient.get<MyShopResponse>(
      '/shops/me',
    )
  },
}
