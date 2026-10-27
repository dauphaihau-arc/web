import type {
  AdminOrderDetailResponse,
  AdminOrderFinancialBreakdown,
  AdminOrderListResponse,
  ListAdminOrdersParams,
  UpdateAdminOrderRefundBody,
  UpdateAdminOrderStatusBody,
} from './contracts/admin-orders.contract';
import { apiClient } from '~/domains/_shared/api-client';

const ADMIN_ORDERS = '/admin/orders';

export const adminOrdersApi = {
  list(params: ListAdminOrdersParams) {
    return apiClient.get<AdminOrderListResponse>(ADMIN_ORDERS, params);
  },

  get(publicId: string) {
    return apiClient.get<AdminOrderDetailResponse>(
      `${ADMIN_ORDERS}/${publicId}`,
    );
  },

  getFinancialBreakdown(publicId: string) {
    return apiClient.get<AdminOrderFinancialBreakdown>(
      `${ADMIN_ORDERS}/${publicId}/financial-breakdown`,
    );
  },

  updateStatus(publicId: string, body: UpdateAdminOrderStatusBody) {
    return apiClient.patch<AdminOrderDetailResponse>(
      `${ADMIN_ORDERS}/${publicId}/status`,
      body,
    );
  },

  updateRefund(publicId: string, body: UpdateAdminOrderRefundBody) {
    return apiClient.patch<AdminOrderDetailResponse>(
      `${ADMIN_ORDERS}/${publicId}/refund`,
      body,
    );
  },
};
