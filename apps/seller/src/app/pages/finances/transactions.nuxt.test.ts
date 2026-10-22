import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import TransactionsPage from './transactions.vue';

vi.mock('./_components/transactions-panel.vue', () => ({
  default: {
    name: 'TransactionsPanelStub',
    template: '<div data-testid="transactions-panel-stub" />',
  },
}));

describe('transactions page', () => {
  it('renders the page shell around the transactions list', async () => {
    const wrapper = await mountSuspended(TransactionsPage);

    expect(wrapper.get('h1').text()).toBe('Transactions');
    expect(wrapper.text()).toContain('Every movement on your Seller Payable: order income, refunds, and payouts.');
    expect(wrapper.find('[data-testid="transactions-panel-stub"]').exists()).toBe(true);
  });
});
