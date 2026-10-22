import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { formatMinorCurrency } from '@arc/utils';
import type { ShopFinanceTransaction } from '~/domains/shop/api/finance/contracts/transactions.contract';
import RecentTransactions from './recent-transactions.vue';

const { recentState } = vi.hoisted(() => ({
  recentState: {
    transactions: [] as ShopFinanceTransaction[],
    isPending: false,
    isError: false,
    requestedLimit: null as number | null,
  },
}));

vi.mock('~/domains/shop/queries/transactions.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    useShopFinanceRecentTransactions: (limit = 5) => {
      recentState.requestedLimit = limit;

      return {
        data: computed(() => (recentState.isError
          ? undefined
          : {
            transactions: recentState.transactions.slice(0, limit),
            total_results: recentState.transactions.length,
            page: 1,
            limit,
          })),
        isPending: computed(() => recentState.isPending),
        isError: computed(() => recentState.isError),
      };
    },
  };
});

function buildTransaction(overrides: Partial<ShopFinanceTransaction> = {}): ShopFinanceTransaction {
  return {
    id: 'txn_1',
    date: '2026-10-20T10:00:00.000Z',
    reference: 'ord_pub_1',
    order_number: '1001',
    type: 'order_income',
    status: 'released',
    order_amount_minor: 12_500,
    fees_minor: -1_250,
    net_amount_minor: 11_250,
    currency: 'USD',
    ...overrides,
  };
}

async function render(transactions: ShopFinanceTransaction[]) {
  recentState.transactions = transactions;
  recentState.isPending = false;
  recentState.isError = false;
  recentState.requestedLimit = null;

  return mountSuspended(RecentTransactions);
}

describe('recent transactions', () => {
  it('owns its loading state', async () => {
    recentState.transactions = [];
    recentState.isPending = true;
    recentState.isError = false;

    const wrapper = await mountSuspended(RecentTransactions);

    expect(wrapper.find('[data-testid="recent-transactions-loading"]').exists()).toBe(true);
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('owns its error state', async () => {
    recentState.transactions = [];
    recentState.isPending = false;
    recentState.isError = true;

    const wrapper = await mountSuspended(RecentTransactions);

    expect(wrapper.get('[data-testid="recent-transactions-error"]').text()).toContain('Unable to load transactions');
  });

  it('shows only the latest five transactions with no filters or pagination', async () => {
    const transactions = Array.from({ length: 6 }, (_unused, index) => buildTransaction({
      id: `txn_${index}`,
      reference: `ord_pub_${index}`,
      order_number: String(1001 + index),
      date: `2026-10-${String(20 - index).padStart(2, '0')}T10:00:00.000Z`,
    }));

    const wrapper = await render(transactions);

    expect(recentState.requestedLimit).toBe(5);
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(wrapper.text()).toContain('1001');
    expect(wrapper.text()).toContain('1005');
    expect(wrapper.text()).not.toContain('1006');
    expect(wrapper.find('[data-testid="transactions-filter-type"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="transactions-load-more"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Load more');
  });

  it('omits the year for current-year dates and keeps it for older dates', async () => {
    const currentYear = new Date().getUTCFullYear();
    const wrapper = await render([
      buildTransaction({
        id: 'txn_current_year',
        reference: 'ord_pub_current',
        order_number: '3001',
        date: `${currentYear}-10-19T10:00:00.000Z`,
      }),
      buildTransaction({
        id: 'txn_previous_year',
        reference: 'ord_pub_previous',
        order_number: '3002',
        date: `${currentYear - 1}-10-19T10:00:00.000Z`,
      }),
    ]);

    const dates = wrapper.findAll('tbody tr').map(row => row.findAll('td')[0].text());

    expect(dates).toEqual(['Oct 19', `Oct 19, ${currentYear - 1}`]);
  });

  it('shows Order numbers on income and refunds and the Payout id on payouts', async () => {
    const wrapper = await render([
      buildTransaction({
        id: 'txn_income',
        reference: 'ord_pub_income',
        order_number: '1001',
        type: 'order_income',
      }),
      buildTransaction({
        id: 'txn_refund',
        reference: 'ord_pub_refund',
        order_number: '1002',
        type: 'refund',
        status: 'deducted',
        order_amount_minor: -2_500,
        fees_minor: 400,
        net_amount_minor: -2_100,
      }),
      buildTransaction({
        id: 'txn_payout',
        reference: 'PAY-20261019-000123',
        order_number: null,
        type: 'payout',
        status: 'paid',
        order_amount_minor: null,
        fees_minor: null,
        net_amount_minor: -10_000,
      }),
    ]);

    const documentNumbers = wrapper.findAll('tbody tr').map(row => row.findAll('td')[1].text());

    expect(documentNumbers).toEqual(['1001', '1002', 'PAY-20261019-000123']);
    expect(wrapper.text()).not.toContain('ord_pub_income');
    expect(wrapper.text()).not.toContain('ord_pub_refund');
  });

  it('renders the money breakdown: income positive, refunds negative, payouts blank', async () => {
    const wrapper = await render([
      buildTransaction({
        id: 'txn_income',
        reference: 'ord_income',
        type: 'order_income',
        status: 'released',
        order_amount_minor: 12_500,
        fees_minor: -1_250,
        net_amount_minor: 11_250,
      }),
      buildTransaction({
        id: 'txn_refund',
        reference: 'ord_refund',
        type: 'refund',
        status: 'deducted',
        order_amount_minor: -2_500,
        fees_minor: 400,
        net_amount_minor: -2_100,
      }),
      buildTransaction({
        id: 'txn_payout',
        reference: 'PAY-20260901-000001',
        type: 'payout',
        status: 'paid',
        order_amount_minor: null,
        fees_minor: null,
        net_amount_minor: -10_000,
      }),
    ]);

    const usd = (value: number) => formatMinorCurrency(value, 'USD');
    const rows = wrapper.findAll('tbody tr');
    const money = (rowIndex: number) => rows[rowIndex].findAll('td').slice(4, 7).map(cell => cell.text());

    expect(money(0)).toEqual([`+${usd(12_500)}`, `-${usd(1_250)}`, `+${usd(11_250)}`]);
    expect(money(1)).toEqual([`-${usd(2_500)}`, `+${usd(400)}`, `-${usd(2_100)}`]);
    expect(money(2)).toEqual(['—', '—', `-${usd(10_000)}`]);
    expect(wrapper.text()).toContain('Order income');
    expect(wrapper.text()).toContain('Refund');
    expect(wrapper.text()).toContain('Payout');
    expect(wrapper.text()).toContain('Deducted');
  });

  it('shows an honest empty state when there is no money movement yet', async () => {
    const wrapper = await render([]);

    expect(wrapper.text()).toContain('Recent transactions');
    expect(wrapper.text()).toContain('No transactions yet');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
  });
});
