import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { ShopFinanceTransaction } from '~/domains/shop/api/finance/contracts/transactions.contract';
import FinancesOverviewPage from './index.vue';

const { overviewState } = vi.hoisted(() => ({
  overviewState: {
    transactions: [] as ShopFinanceTransaction[],
    payoutAccount: null as null | {
      id: string
      type: string
      holderName: string
      bankName: string
      last4: string
      country: string
      currency: string
      status: string
      verifiedAt: string | null
    },
    recentLimit: null as number | null,
  },
}));

vi.mock('~/domains/shop/queries/finance-payable.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayable: () => ({
      data: computed(() => ({
        currency: 'USD',
        available_minor: 12_500,
        not_yet_available_minor: 0,
      })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/payout-account.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayoutAccount: () => ({
      data: computed(() => ({ payout_account: overviewState.payoutAccount })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/payouts.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayouts: () => ({
      data: computed(() => ({ payouts: [] })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/payout-settings.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayoutSettings: () => ({
      data: computed(() => ({
        auto_payout_enabled: false,
        auto_payout_day_of_month: 15,
        auto_payout_eligible: true,
        auto_payout_ineligible_reason: null,
        manual_withdrawals_remaining: 1,
      })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/transactions.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinanceRecentTransactions: (limit = 5) => {
      overviewState.recentLimit = limit;

      return {
        data: computed(() => ({
          transactions: overviewState.transactions.slice(0, limit),
          total_results: overviewState.transactions.length,
          page: 1,
          limit,
        })),
        isPending: computed(() => false),
        isError: computed(() => false),
      };
    },
  };
});

function buildTransaction(overrides: Partial<ShopFinanceTransaction> = {}): ShopFinanceTransaction {
  return {
    id: 'txn_1',
    date: '2026-10-25T10:00:00.000Z',
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

async function render() {
  overviewState.payoutAccount = {
    id: 'pa_1',
    type: 'bank',
    holderName: 'Ada Lovelace',
    bankName: 'Analytical Bank',
    last4: '4242',
    country: 'US',
    currency: 'USD',
    status: 'active',
    verifiedAt: '2026-01-02T00:00:00.000Z',
  };
  overviewState.transactions = Array.from({ length: 6 }, (_unused, index) => buildTransaction({
    id: `txn_${index}`,
    reference: `ord_pub_${index}`,
    order_number: String(1001 + index),
    date: `2026-10-${String(25 - index).padStart(2, '0')}T10:00:00.000Z`,
  }));
  overviewState.recentLimit = null;

  return mountSuspended(FinancesOverviewPage);
}

describe('finances overview page', () => {
  it('renders the payable and payout account cards', async () => {
    const wrapper = await render();

    expect(wrapper.text()).toContain('Available');
    expect(wrapper.text()).toContain('Payout account');
  });

  it('renders the latest five recent transactions without filter or pagination controls', async () => {
    const wrapper = await render();
    const overview = wrapper.get('[data-testid="finances-overview"]');

    expect(overviewState.recentLimit).toBe(5);
    expect(overview.text()).toContain('Recent transactions');
    expect(overview.findAll('tbody tr')).toHaveLength(5);
    expect(overview.text()).toContain('1001');
    expect(overview.text()).not.toContain('1006');
    expect(overview.find('[data-testid="transactions-filter-type"]').exists()).toBe(false);
    expect(overview.find('[data-testid="transactions-load-more"]').exists()).toBe(false);
    expect(overview.text()).not.toContain('Load more');
  });

  it('does not render the transactions or payouts list pages', async () => {
    const wrapper = await render();

    expect(wrapper.find('[data-testid="transactions-panel"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Payout history');
    expect(wrapper.findAll('span').some(span => span.text() === 'Date and time')).toBe(false);
    expect(wrapper.findAll('span').some(span => span.text() === 'Payouts')).toBe(false);
  });
});
