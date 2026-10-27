import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { OrderStatuses } from '@arc/enums/order';
import type * as vueQuery from '@tanstack/vue-query';
import type { AdminOrderDetailResponse } from '~/domains/orders/api/contracts/admin-orders.contract';
import { useAdminUpdateOrderRefund } from './update-refund.mutation';
import { useAdminUpdateOrderStatus } from './update-status.mutation';

const {
  mockUpdateStatus, mockUpdateRefund, mockSetQueryData, mockInvalidateQueries, mockToastAdd,
} = vi.hoisted(() => ({
  mockUpdateStatus: vi.fn(),
  mockUpdateRefund: vi.fn(),
  mockSetQueryData: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockToastAdd: vi.fn(),
}));

vi.mock('~/domains/orders/api/admin-orders.api', () => ({
  adminOrdersApi: {
    updateStatus: mockUpdateStatus,
    updateRefund: mockUpdateRefund,
  },
}));

mockNuxtImport('useQueryClient', () => () => ({
  setQueryData: mockSetQueryData,
  invalidateQueries: mockInvalidateQueries,
}));

mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }));

// The composables only depend on `useMutation`'s contract, so a recorded
// executor keeps each mutation deterministic without a Vue query observer.
vi.mock('@tanstack/vue-query', async (importOriginal) => {
  const actual = await importOriginal<typeof vueQuery>();

  return {
    ...actual,
    useQueryClient: () => ({
      setQueryData: mockSetQueryData,
      invalidateQueries: mockInvalidateQueries,
    }),
    useMutation: (options: {
      mutationFn: (variables: unknown) => Promise<unknown>
      onSuccess?: (data: unknown, variables: unknown) => unknown
      onError?: (error: unknown, variables: unknown) => unknown
    }) => ({
      mutateAsync: async (variables: unknown) => {
        try {
          const data = await options.mutationFn(variables);
          await options.onSuccess?.(data, variables);

          return data;
        }
        catch (error) {
          await options.onError?.(error, variables);
          throw error;
        }
      },
    }),
  };
});

const orderId = 'ord_1';
const detail = {
  order: { public_id: orderId },
} as unknown as AdminOrderDetailResponse;

describe('admin order mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the status and refreshes the detail cache and order list', async () => {
    const body = { status: OrderStatuses.CANCELED, cancel_reason: 'customer request' };
    mockUpdateStatus.mockResolvedValue(detail);

    await useAdminUpdateOrderStatus().mutateAsync({ orderId, body });

    expect(mockUpdateStatus).toHaveBeenCalledWith(orderId, body);
    expect(mockSetQueryData).toHaveBeenCalledWith(['admin-orders', 'detail', orderId], detail);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-orders', 'list'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin-orders', 'financial-breakdown', orderId],
    });
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Order updated' }));
  });

  it('leaves the cache untouched when the status update fails', async () => {
    mockUpdateStatus.mockRejectedValue(new Error('order not found'));

    await expect(useAdminUpdateOrderStatus().mutateAsync({
      orderId,
      body: { status: OrderStatuses.CANCELED },
    })).rejects.toThrow('order not found');

    expect(mockSetQueryData).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Failed to update order',
      description: 'order not found',
    }));
  });

  it('updates the refund and refreshes the detail cache and order list', async () => {
    const body = { action: 'retry' as const, reason: 'gateway timeout' };
    mockUpdateRefund.mockResolvedValue(detail);

    await useAdminUpdateOrderRefund().mutateAsync({ orderId, body });

    expect(mockUpdateRefund).toHaveBeenCalledWith(orderId, body);
    expect(mockSetQueryData).toHaveBeenCalledWith(['admin-orders', 'detail', orderId], detail);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-orders', 'list'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin-orders', 'financial-breakdown', orderId],
    });
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Refund updated' }));
  });

  it('leaves the cache untouched when the refund update fails', async () => {
    mockUpdateRefund.mockRejectedValue(new Error('refund conflict'));

    await expect(useAdminUpdateOrderRefund().mutateAsync({
      orderId,
      body: { action: 'retry' },
    })).rejects.toThrow('refund conflict');

    expect(mockSetQueryData).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Failed to update refund',
      description: 'refund conflict',
    }));
  });
});
