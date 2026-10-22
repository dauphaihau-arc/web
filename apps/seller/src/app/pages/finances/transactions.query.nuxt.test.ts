import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, ref } from 'vue';
import type { ShopFinanceTransactionFilters } from '~/domains/shop/queries/transactions.query';
import { useShopFinanceTransactions } from '~/domains/shop/queries/transactions.query';

const { getTransactions, resolveMyShopId } = vi.hoisted(() => ({
  getTransactions: vi.fn(),
  resolveMyShopId: vi.fn(async () => 'shop_1'),
}));

vi.mock('~/domains/shop/api/finance/finance.api', () => ({
  shopFinanceApi: {
    getTransactions,
  },
}));

vi.mock('~/domains/shop/utils/resolve-my-shop-id', () => ({
  resolveMyShopId,
}));

describe('shop finance transactions query', () => {
  beforeEach(() => {
    getTransactions.mockReset();
    getTransactions.mockResolvedValue({
      transactions: [],
      total_results: 41,
      page: 1,
      limit: 20,
    });
    resolveMyShopId.mockClear();
  });

  it('sends numbered page params and maps filters and totals', async () => {
    const filters = ref<ShopFinanceTransactionFilters>({});
    const page = ref(1);

    const wrapper = await mountSuspended(defineComponent({
      setup() {
        const query = useShopFinanceTransactions(filters, page, 20);

        return () => h('div', [
          h('span', { 'data-testid': 'total' }, String(query.data.value?.total_results ?? '')),
          h('span', { 'data-testid': 'page' }, String(query.data.value?.page ?? '')),
        ]);
      },
    }));

    await vi.waitFor(() => expect(getTransactions).toHaveBeenCalledTimes(1));

    expect(getTransactions).toHaveBeenLastCalledWith('shop_1', { page: 1, limit: 20 });
    expect(wrapper.get('[data-testid="total"]').text()).toBe('41');

    page.value = 2;
    await vi.waitFor(() => expect(getTransactions).toHaveBeenCalledTimes(2));

    expect(getTransactions).toHaveBeenLastCalledWith('shop_1', { page: 2, limit: 20 });

    // A filter change starts a new page walk at page 1 and translates
    // date-only inputs into inclusive ISO timestamps.
    filters.value = {
      type: 'refund',
      status: 'deducted',
      from: '2026-10-01',
      to: '2026-10-31',
    };
    page.value = 1;
    await vi.waitFor(() => expect(getTransactions).toHaveBeenCalledTimes(3));

    expect(getTransactions).toHaveBeenLastCalledWith('shop_1', {
      page: 1,
      limit: 20,
      type: 'refund',
      status: 'deducted',
      date_from: '2026-10-01T00:00:00.000Z',
      date_to: '2026-10-31T23:59:59.999Z',
    });

    wrapper.unmount();
  });
});
