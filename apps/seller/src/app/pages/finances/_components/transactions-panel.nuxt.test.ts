import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { nextTick } from 'vue';
import { formatMinorCurrency } from '@arc/utils';
import type { ShopFinanceTransaction } from '~/domains/shop/api/finance/contracts/transactions.contract';
import type { VueWrapper } from '@vue/test-utils';
import TransactionsPanel from './transactions-panel.vue';

const { panelState } = vi.hoisted(() => ({
  panelState: {
    transactions: [] as ShopFinanceTransaction[],
    isPending: false,
    isError: false,
    hasResponse: true,
    totalResults: null as number | null,
    lastRequestedPage: null as number | null,
    refetchCalls: 0,
  },
}));

vi.mock('~/domains/shop/queries/transactions.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed, toValue } = await import('vue');
  const pageLimit = 20;

  return {
    TRANSACTIONS_PAGE_LIMIT: pageLimit,
    useShopFinanceTransactions: (filters?: unknown, requestedPage?: unknown) => {
      const page = computed(() => Number(toValue(requestedPage) ?? 1));
      const filtered = computed(() => {
        const active = (toValue(filters) ?? {}) as {
          type?: string
          status?: string
          from?: string
          to?: string
        };

        return panelState.transactions.filter((transaction) => {
          if (active.type && transaction.type !== active.type) {
            return false;
          }

          if (active.status && transaction.status !== active.status) {
            return false;
          }

          const transactionTime = new Date(transaction.date).getTime();

          if (active.from && transactionTime < new Date(active.from).getTime()) {
            return false;
          }

          if (active.to && transactionTime > new Date(active.to).getTime()) {
            return false;
          }

          return true;
        });
      });

      return {
        data: computed(() => {
          panelState.lastRequestedPage = page.value;

          if (!panelState.hasResponse) {
            return undefined;
          }

          const start = (page.value - 1) * pageLimit;

          return {
            transactions: filtered.value.slice(start, start + pageLimit),
            total_results: panelState.totalResults ?? filtered.value.length,
            page: page.value,
            limit: pageLimit,
          };
        }),
        isPending: computed(() => panelState.isPending),
        isError: computed(() => panelState.isError),
        isFetching: computed(() => false),
        refetch: () => {
          panelState.refetchCalls += 1;
        },
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

function buildTransactions(count: number) {
  return Array.from({ length: count }, (_unused, index) => buildTransaction({
    id: `txn_${index}`,
    reference: `ord_pub_${index}`,
    order_number: String(1001 + index),
    date: new Date(Date.UTC(2026, 9, 20, 10, index)).toISOString(),
  }));
}

async function render(transactions: ShopFinanceTransaction[], options: {
  hasResponse?: boolean
  isError?: boolean
  totalResults?: number | null
} = {}) {
  panelState.transactions = transactions;
  panelState.isPending = false;
  panelState.isError = options.isError ?? false;
  panelState.hasResponse = options.hasResponse ?? true;
  panelState.totalResults = options.totalResults ?? null;
  panelState.lastRequestedPage = null;
  panelState.refetchCalls = 0;

  return mountSuspended(TransactionsPanel);
}

function chip(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('span').find(candidate => candidate.text() === label);

  if (!found) {
    throw new Error(`Filter chip "${label}" not found`);
  }

  return found;
}

async function openFilter(wrapper: VueWrapper, label: string) {
  await chip(wrapper, label).trigger('click');
}

async function selectFilterOption(wrapper: VueWrapper, testId: string, label: string) {
  await wrapper.get(`[data-testid="${testId}"]`).trigger('click');

  const option = wrapper.findAll('li').find(candidate => candidate.text() === label);

  if (!option) {
    throw new Error(`Filter option "${label}" not found`);
  }

  await option.trigger('click');
  await nextTick();
}

async function applyOpenFilter(wrapper: VueWrapper) {
  const applyButton = wrapper.findAll('button').find(button => button.text() === 'Apply');

  if (!applyButton) {
    throw new Error('Apply button not found');
  }

  const form = applyButton.element.closest('form');

  if (!form) {
    throw new Error('Filter form not found');
  }

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await nextTick();
}

function filterChipLabels(wrapper: VueWrapper) {
  return [...new Set(wrapper.findAll('span')
    .map(span => span.text())
    .filter(text => ['Type', 'Status', 'Date and time'].includes(text)))];
}

describe('transactions panel', () => {
  it('owns its loading state', async () => {
    panelState.transactions = [];
    panelState.isPending = true;
    panelState.isError = false;

    const wrapper = await mountSuspended(TransactionsPanel);

    expect(wrapper.find('[data-testid="transactions-loading"]').exists()).toBe(true);
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('owns its fatal error state when nothing loaded', async () => {
    panelState.transactions = [];
    panelState.isPending = false;
    panelState.isError = true;
    panelState.hasResponse = false;

    const wrapper = await mountSuspended(TransactionsPanel);

    expect(wrapper.get('[data-testid="transactions-error"]').text()).toContain('Unable to load transactions');
  });

  it('keeps loaded rows and filters when a page fetch fails', async () => {
    const wrapper = await render([buildTransaction()], {
      isError: true,
      hasResponse: true,
    });

    expect(wrapper.find('[data-testid="transactions-error"]').exists()).toBe(false);
    expect(filterChipLabels(wrapper)).toEqual(['Type', 'Status', 'Date and time']);
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain('1001');

    const inlineError = wrapper.get('[data-testid="transactions-page-error"]');
    expect(inlineError.text()).toContain('Could not load this page');

    await wrapper.get('[data-testid="transactions-retry-page"]').trigger('click');

    expect(panelState.refetchCalls).toBe(1);
  });

  it('shows the shared filter toolbar and the full table', async () => {
    const wrapper = await render([buildTransaction()]);

    expect(filterChipLabels(wrapper)).toEqual(['Type', 'Status', 'Date and time']);

    expect(wrapper.findAll('thead th').map(header => header.text())).toEqual([
      'Date',
      'Reference',
      'Type',
      'Status',
      'Order amount',
      'Fees',
      'Net amount',
    ]);
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[2].text()).toBe('Order income');
    expect(cells[2].find('.rounded-md').exists()).toBe(false);
    expect(cells[3].find('.rounded-md').exists()).toBe(true);
  });

  it('omits the year from current-year dates and keeps it for older dates', async () => {
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

  it('shows the Order number on income and refund rows and the Payout reference on payout rows', async () => {
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

  it('filters by type and status through the shared filter popovers', async () => {
    const wrapper = await render([
      buildTransaction({
        id: 'txn_income',
        reference: 'ord_pub_income',
        order_number: '1001',
        type: 'order_income',
        status: 'released',
        date: '2026-10-20T10:00:00.000Z',
      }),
      buildTransaction({
        id: 'txn_refund',
        reference: 'ord_pub_refund',
        order_number: '1002',
        type: 'refund',
        status: 'deducted',
        date: '2026-10-10T10:00:00.000Z',
      }),
      buildTransaction({
        id: 'txn_payout',
        reference: 'PAY-20260901-000001',
        order_number: null,
        type: 'payout',
        status: 'paid',
        date: '2026-09-01T10:00:00.000Z',
      }),
    ]);

    expect(wrapper.text()).toContain('1001');
    expect(wrapper.text()).toContain('1002');
    expect(wrapper.text()).toContain('PAY-20260901-000001');

    await openFilter(wrapper, 'Type');
    await selectFilterOption(wrapper, 'transactions-filter-type', 'Refund');
    await applyOpenFilter(wrapper);

    expect(wrapper.text()).toContain('1002');
    expect(wrapper.text()).not.toContain('1001');
    expect(wrapper.text()).not.toContain('PAY-20260901-000001');

    await wrapper.get('[data-testid="transactions-clear-filters"]').trigger('click');
    await openFilter(wrapper, 'Status');
    await selectFilterOption(wrapper, 'transactions-filter-status', 'Paid');
    await applyOpenFilter(wrapper);

    expect(wrapper.text()).toContain('PAY-20260901-000001');
    expect(wrapper.text()).not.toContain('1002');
    expect(wrapper.text()).not.toContain('1001');
  });

  it('filters by a date range through the shared date filter', async () => {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const wrapper = await render([
      buildTransaction({
        id: 'txn_recent',
        reference: 'ord_pub_recent',
        order_number: '2001',
        date: new Date(now - day).toISOString(),
      }),
      buildTransaction({
        id: 'txn_older',
        reference: 'ord_pub_older',
        order_number: '2002',
        type: 'refund',
        status: 'deducted',
        order_amount_minor: -2_500,
        fees_minor: 400,
        net_amount_minor: -2_100,
        date: new Date(now - 20 * day).toISOString(),
      }),
    ]);

    await openFilter(wrapper, 'Date and time');
    await wrapper.get('input[type="number"]').setValue('7');
    await applyOpenFilter(wrapper);

    expect(wrapper.text()).toContain('2001');
    expect(wrapper.text()).not.toContain('2002');
  });

  it('renders Order amount, Fees, and Net amount with their signs and tones', async () => {
    const wrapper = await render([
      buildTransaction({
        id: 'txn_income',
        reference: 'ord_pub_income',
        order_number: '1001',
        type: 'order_income',
        status: 'released',
        order_amount_minor: 12_500,
        fees_minor: -1_250,
        net_amount_minor: 11_250,
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
        reference: 'PAY-20260901-000001',
        order_number: null,
        type: 'payout',
        status: 'paid',
        order_amount_minor: null,
        fees_minor: null,
        net_amount_minor: -10_000,
      }),
      buildTransaction({
        id: 'txn_zero',
        reference: 'ord_pub_zero',
        order_number: '1003',
        type: 'order_income',
        status: 'released',
        order_amount_minor: 0,
        fees_minor: 0,
        net_amount_minor: 0,
      }),
    ]);

    const usd = (value: number) => formatMinorCurrency(value, 'USD');
    const moneySpans = (rowIndex: number) => wrapper
      .findAll('tbody tr')[rowIndex]
      .findAll('td')
      .slice(4, 7)
      .map(cell => cell.get('span'));

    const income = moneySpans(0);
    expect(income.map(span => span.text()))
      .toEqual([`+${usd(12_500)}`, `-${usd(1_250)}`, `+${usd(11_250)}`]);
    // Income: the Order amount is plain, the fee is a loss, the net is a gain.
    expect(income[0].classes()).toContain('text-text-strong');
    expect(income[1].classes()).toContain('text-state-danger-text');
    expect(income[2].classes()).toContain('text-state-success-text');

    const refund = moneySpans(1);
    expect(refund.map(span => span.text()))
      .toEqual([`-${usd(2_500)}`, `+${usd(400)}`, `-${usd(2_100)}`]);
    expect(refund[0].classes()).toContain('text-state-danger-text');
    expect(refund[1].classes()).toContain('text-state-success-text');
    expect(refund[2].classes()).toContain('text-state-danger-text');

    const payout = moneySpans(2);
    expect(payout.map(span => span.text()))
      .toEqual(['—', '—', `-${usd(10_000)}`]);
    expect(payout[0].classes()).toContain('text-text-muted');
    expect(payout[1].classes()).toContain('text-text-muted');
    // A payout is the seller's own money leaving, so its net is not a loss.
    expect(payout[2].classes()).toContain('text-text-strong');
    expect(payout[2].classes()).not.toContain('text-state-danger-text');

    moneySpans(3).forEach((span) => {
      expect(span.text()).toBe(usd(0));
      expect(span.text()).not.toContain('+');
      expect(span.text()).not.toContain('-');
    });
  });

  it('de-emphasizes the money cells on pending rows', async () => {
    const wrapper = await render([
      buildTransaction({
        id: 'txn_pending',
        status: 'pending',
        order_amount_minor: 12_500,
        fees_minor: -1_250,
        net_amount_minor: 11_250,
      }),
    ]);

    const spans = wrapper.get('tbody tr').findAll('td').slice(4, 7).map(cell => cell.get('span'));

    spans.forEach((span) => {
      expect(span.classes()).toContain('text-text-muted');
      expect(span.classes()).not.toContain('text-state-success-text');
      expect(span.classes()).not.toContain('text-state-danger-text');
    });
  });

  it('pages through numbered results using total_results from the API', async () => {
    const wrapper = await render(buildTransactions(40));

    expect(wrapper.findAll('tbody tr')).toHaveLength(20);
    expect(wrapper.text()).toContain('Viewing 1 - 20 of 40 results');
    expect(wrapper.text()).toContain('1001');
    expect(wrapper.text()).not.toContain('1021');

    const secondPage = wrapper.findAll('button').find(button => button.text() === '2');

    if (!secondPage) {
      throw new Error('Page 2 button not found');
    }

    await secondPage.trigger('click');

    expect(panelState.lastRequestedPage).toBe(2);
    expect(wrapper.findAll('tbody tr')).toHaveLength(20);
    expect(wrapper.text()).toContain('1021');
    expect(wrapper.text()).toContain('1040');
    expect(wrapper.text()).not.toContain('1001');
  });

  it('resets to the first page when a filter changes', async () => {
    const wrapper = await render(buildTransactions(40));

    const secondPage = wrapper.findAll('button').find(button => button.text() === '2');

    if (!secondPage) {
      throw new Error('Page 2 button not found');
    }

    await secondPage.trigger('click');
    expect(panelState.lastRequestedPage).toBe(2);

    await openFilter(wrapper, 'Type');
    await selectFilterOption(wrapper, 'transactions-filter-type', 'Refund');
    await applyOpenFilter(wrapper);

    expect(panelState.lastRequestedPage).toBe(1);
    expect(wrapper.text()).toContain('No transactions match these filters');
  });

  it('distinguishes an empty timeline from an empty filter result', async () => {
    const empty = await render([]);

    expect(empty.text()).toContain('No transactions yet');

    const filtered = await render([]);

    await openFilter(filtered, 'Type');
    await selectFilterOption(filtered, 'transactions-filter-type', 'Refund');
    await applyOpenFilter(filtered);

    expect(filtered.text()).toContain('No transactions match these filters');
  });

  it('clears every filter at once', async () => {
    const wrapper = await render([buildTransaction()]);

    await openFilter(wrapper, 'Type');
    await selectFilterOption(wrapper, 'transactions-filter-type', 'Refund');
    await applyOpenFilter(wrapper);

    expect(wrapper.text()).toContain('No transactions match these filters');

    await wrapper.get('[data-testid="transactions-clear-filters"]').trigger('click');

    expect(wrapper.text()).toContain('1001');
    expect(wrapper.find('[data-testid="transactions-clear-filters"]').exists()).toBe(false);
  });
});
