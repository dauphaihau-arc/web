import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { formatMinorCurrency } from '@arc/utils';
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract';
import PayoutHistory from './payout-history.vue';

function buildPayout(overrides: Partial<ShopFinancePayout> = {}): ShopFinancePayout {
  return {
    id: 'pay_2f5a91c4b7de',
    amount_minor: 12_500,
    currency: 'USD',
    state: 'paid',
    paid_at: '2026-10-19T09:15:00.000Z',
    created_at: '2026-10-19T09:15:00.000Z',
    ...overrides,
  };
}

async function render(payouts: ShopFinancePayout[]) {
  return mountSuspended(PayoutHistory, {
    props: { payouts },
  });
}

describe('payout history', () => {
  it('shows a paid payout with its amount, currency, date and state', async () => {
    const wrapper = await render([buildPayout()]);

    const headers = wrapper.findAll('thead th');
    expect(headers.map(header => header.text())).toEqual(['Amount', 'Currency', 'Date', 'State']);

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(1);

    const cells = rows[0].findAll('td');
    expect(cells).toHaveLength(4);
    expect(cells[0].text()).toContain(formatMinorCurrency(12_500, 'USD'));
    expect(cells[1].text()).toContain('USD');
    expect(cells[2].text()).toContain('Oct 19, 2026');
    expect(cells[3].text()).toContain('Paid');
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

  it('shows an honest empty state when the shop has no payouts yet', async () => {
    const wrapper = await render([]);

    expect(wrapper.text()).toContain('Payout history');
    expect(wrapper.text()).toContain('No payouts yet');

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].findAll('td')).toHaveLength(1);
    expect(rows[0].text()).not.toContain(formatMinorCurrency(12_500, 'USD'));
  });
});
