import type {
  AdminShopListResponse,
  ListAdminShopsParams,
} from './contracts/admin-shops.contract';
import { apiClient } from '~/domains/_shared/api-client';

const ADMIN_SHOPS = '/admin/shops';

export const adminShopsApi = {
  /** The shop directory, newest first. The API owns paging and matching. */
  list(params: ListAdminShopsParams) {
    return apiClient.get<AdminShopListResponse>(ADMIN_SHOPS, params);
  },
};
