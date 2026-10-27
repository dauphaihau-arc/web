/** Shared between the list/detail reads and the mutations that invalidate them. */
export const ADMIN_ORDERS_LIST_KEY = ['admin-orders', 'list'] as const;

export const adminOrderDetailKey = (orderId: string) =>
  ['admin-orders', 'detail', orderId] as const;

export const adminOrderFinancialBreakdownKey = (orderId: string) =>
  ['admin-orders', 'financial-breakdown', orderId] as const;
