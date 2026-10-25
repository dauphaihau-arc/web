import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { nextTick } from 'vue';
import { formatMinorCurrency } from '@arc/utils';
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract';
import type { VueWrapper } from '@vue/test-utils';
import PayoutHistory from './payout-history.vue';

const { historyState } = vi.hoisted(() => ({
  historyState: {
    payouts: [] as ShopFinancePayout[],
    isPending: false,
    isError: false,
  },
}));

vi.mock('~/domains/shop/queries/payouts.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    useShopFinancePayouts: () => ({
      data: computed(() => (historyState.isError ? undefined : { payouts: historyState.payouts })),
      isPending: computed(() => historyState.isPending),
      isError: computed(() => historyState.isError),
    }),
  };
});

function buildPayout(overrides: Partial<ShopFinancePayout> = {}): ShopFinancePayout {
  return {
    id: 'pay_2f5a91c4b7de',
    amount_minor: 12_500,
    currency: 'USD',
    source_currency: 'USD',
    target_currency: 'USD',
    fx_rate: '1',
    target_amount_minor: 12_500,
    provider_fx_rate: null,
    fx_fee_minor: 0,
    state: 'paid',
    source: 'scheduled',
    period: '2026-10',
    reason: null,
    paid_at: '2026-10-19T09:15:00.000Z',
    created_at: '2026-10-19T09:15:00.000Z',
    ...overrides,
  };
}

async function render(payouts: ShopFinancePayout[]) {
  historyState.payouts = payouts;
  historyState.isPending = false;
  historyState.isError = false;

  return mountSuspended(PayoutHistory);
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

async function toggleOption(wrapper: VueWrapper, label: string) {
  const option = wrapper.findAll('label').find(candidate => candidate.text() === label);

  if (!option) {
    throw new Error(`Filter option "${label}" not found`);
  }

  const checkbox = option.find('input[type="checkbox"]');

  if (checkbox.exists()) {
    await checkbox.setValue(true);
    return;
  }

  await option.trigger('click');
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

describe('payout history', () => {
  it('owns its loading state', async () => {
    historyState.payouts = [];
    historyState.isPending = true;
    historyState.isError = false;

    const wrapper = await mountSuspended(PayoutHistory);

    expect(wrapper.text()).not.toContain('Payout history');
  });

  it('owns its error state', async () => {
    historyState.payouts = [];
    historyState.isPending = false;
    historyState.isError = true;

    const wrapper = await mountSuspended(PayoutHistory);

    expect(wrapper.text()).toContain('Unable to load payout history');
  });

  it('shows a paid payout with its amount, currency, date and state', async () => {
    const wrapper = await render([buildPayout()]);

    const headers = wrapper.findAll('thead th');
    expect(headers.map(header => header.text())).toEqual(['Amount', 'Currency', 'Date', 'State', 'Source']);

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(1);

    const cells = rows[0].findAll('td');
    expect(cells).toHaveLength(5);
    expect(cells[0].text()).toContain(formatMinorCurrency(12_500, 'USD'));
    expect(cells[1].text()).toContain('USD');
    expect(cells[2].text()).toContain('Oct 19, 2026');
    expect(cells[3].text()).toContain('Paid');
    expect(cells[4].text()).toContain('Scheduled');
  });

  it('shows a same-currency payout as the single paid amount', async () => {
    const wrapper = await render([buildPayout()]);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[0].text()).toBe(formatMinorCurrency(12_500, 'USD'));
    expect(cells[0].text()).not.toContain('→');
    expect(cells[1].text()).toBe('USD');
  });

  it('shows the received amount next to the paid amount for a converted payout', async () => {
    const wrapper = await render([
      buildPayout({
        source: 'manual',
        amount_minor: 12_500,
        currency: 'USD',
        source_currency: 'USD',
        target_currency: 'VND',
        fx_rate: '25400.0000000000',
        provider_fx_rate: '25010.0000000000',
        target_amount_minor: 285_750_000,
        fx_fee_minor: 0,
      }),
    ]);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[0].text()).toContain(formatMinorCurrency(12_500, 'USD'));
    expect(cells[0].text()).toContain('→');
    expect(cells[0].text()).toContain(formatMinorCurrency(285_750_000, 'VND'));
    expect(cells[0].text()).toContain('1 USD = 25,010 VND');
    expect(cells[0].text()).not.toContain('25,400');
    expect(cells[1].text()).toBe('USD → VND');
  });

  it('shows the claim-time rate when the provider has not reported one', async () => {
    const wrapper = await render([
      buildPayout({
        source: 'manual',
        target_currency: 'VND',
        fx_rate: '25400.0000000000',
        provider_fx_rate: null,
        target_amount_minor: 285_750_000,
      }),
    ]);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[0].text()).toContain('1 USD = 25,400 VND');
  });

  it('shows no received amount until the provider reports the target amount', async () => {
    const wrapper = await render([
      buildPayout({
        source: 'manual',
        amount_minor: 12_500,
        target_currency: 'VND',
        fx_rate: '25400.0000000000',
        provider_fx_rate: '25010.0000000000',
        target_amount_minor: null,
      }),
    ]);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[0].text()).toContain(formatMinorCurrency(12_500, 'USD'));
    expect(cells[0].text()).not.toContain('→');
    expect(cells[0].text()).toContain('1 USD = 25,010 VND');
    expect(cells[1].text()).toBe('USD');
  });

  it('keeps a payout recorded before the frozen quote readable', async () => {
    const wrapper = await render([
      buildPayout({
        source_currency: null,
        target_currency: null,
        fx_rate: null,
        target_amount_minor: null,
        provider_fx_rate: null,
        fx_fee_minor: null,
      }),
    ]);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[0].text()).toBe(formatMinorCurrency(12_500, 'USD'));
    expect(cells[1].text()).toBe('USD');
  });

  it('falls back to the created date while a payout has not been paid', async () => {
    const wrapper = await render([
      buildPayout({
        state: 'pending',
        paid_at: null,
        created_at: '2026-10-18T08:00:00.000Z',
      }),
    ]);

    const cells = wrapper.get('tbody tr').findAll('td');
    expect(cells[2].text()).toContain('Oct 18, 2026');
    expect(cells[3].text()).toContain('Pending');
  });

  it('marks a manual withdrawal as manual', async () => {
    const wrapper = await render([
      buildPayout({
        source: 'manual',
        period: '2026-10',
      }),
    ]);

    expect(wrapper.get('tbody tr').findAll('td')[4].text()).toContain('Manual');
  });

  it('shows a blocked payout with the reason it was not sent', async () => {
    const wrapper = await render([
      buildPayout({
        state: 'blocked',
        reason: 'no_payout_account',
        paid_at: null,
      }),
    ]);

    expect(wrapper.text()).toContain('Blocked');
    expect(wrapper.text()).toContain('No payout account');
  });

  it('shows an honest empty state when the shop has no payouts yet', async () => {
    const wrapper = await render([]);

    expect(wrapper.text()).not.toContain('Payout history');
    expect(wrapper.text()).toContain('No payouts yet');

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].findAll('td')).toHaveLength(1);
    expect(rows[0].text()).not.toContain(formatMinorCurrency(12_500, 'USD'));
  });

  it('filters by state and source through the shared filter toolbar', async () => {
    const wrapper = await render([
      buildPayout({
        id: 'pay_paid',
        amount_minor: 12_500,
        state: 'paid',
        source: 'scheduled',
      }),
      buildPayout({
        id: 'pay_pending',
        amount_minor: 7_500,
        state: 'pending',
        source: 'manual',
        paid_at: null,
      }),
      buildPayout({
        id: 'pay_blocked',
        amount_minor: 3_000,
        state: 'blocked',
        source: 'scheduled',
        reason: 'no_payout_account',
        paid_at: null,
      }),
    ]);

    expect(wrapper.findAll('tbody tr')).toHaveLength(3);

    await openFilter(wrapper, 'State');
    await toggleOption(wrapper, 'Paid');
    await applyOpenFilter(wrapper);

    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain(formatMinorCurrency(12_500, 'USD'));
    expect(wrapper.text()).not.toContain(formatMinorCurrency(7_500, 'USD'));
    expect(wrapper.text()).not.toContain(formatMinorCurrency(3_000, 'USD'));

    await wrapper.get('[data-testid="payouts-clear-filters"]').trigger('click');

    expect(wrapper.findAll('tbody tr')).toHaveLength(3);

    await openFilter(wrapper, 'Source');
    await toggleOption(wrapper, 'Manual');
    await applyOpenFilter(wrapper);

    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain(formatMinorCurrency(7_500, 'USD'));
    expect(wrapper.text()).not.toContain(formatMinorCurrency(12_500, 'USD'));
    expect(wrapper.text()).not.toContain(formatMinorCurrency(3_000, 'USD'));
  });

  it('shows an empty filter result instead of claiming there are no payouts', async () => {
    const wrapper = await render([buildPayout()]);

    await openFilter(wrapper, 'State');
    await toggleOption(wrapper, 'Failed');
    await applyOpenFilter(wrapper);

    expect(wrapper.text()).toContain('No payouts match these filters');
    expect(wrapper.text()).not.toContain('No payouts yet');
  });

  it('keeps the filter toolbar available while the payout list fails', async () => {
    historyState.payouts = [];
    historyState.isPending = false;
    historyState.isError = true;

    const wrapper = await mountSuspended(PayoutHistory);

    expect(wrapper.text()).toContain('Unable to load payout history');
    expect(wrapper.findAll('span').some(span => span.text() === 'State')).toBe(true);
  });
});
