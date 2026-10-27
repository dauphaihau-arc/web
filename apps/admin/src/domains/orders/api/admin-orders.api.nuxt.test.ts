import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { OrderStatuses } from '@arc/enums/order';
import { adminOrdersApi } from './admin-orders.api';

const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock('~/domains/_shared/api-client', () => ({
  apiClient: { get: mockGet, patch: mockPatch },
}));

describe('admin orders api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the order list and a single order from the admin endpoints', () => {
    const params = { page: 2, limit: 50 };

    adminOrdersApi.list(params);
    adminOrdersApi.get('ord_1');

    expect(mockGet).toHaveBeenNthCalledWith(1, '/admin/orders', params);
    expect(mockGet).toHaveBeenNthCalledWith(2, '/admin/orders/ord_1');
  });

  it('reads the financial breakdown for a single order', () => {
    adminOrdersApi.getFinancialBreakdown('ord_1');

    expect(mockGet).toHaveBeenCalledWith('/admin/orders/ord_1/financial-breakdown');
  });

  it('patches the status endpoint with the request body', () => {
    const body = { status: OrderStatuses.CANCELED, cancel_reason: 'customer request' };

    adminOrdersApi.updateStatus('ord_1', body);

    expect(mockPatch).toHaveBeenCalledWith('/admin/orders/ord_1/status', body);
  });

  it('patches the refund endpoint with the request body', () => {
    const body = { action: 'retry' as const };

    adminOrdersApi.updateRefund('ord_1', body);

    expect(mockPatch).toHaveBeenCalledWith('/admin/orders/ord_1/refund', body);
  });
});
