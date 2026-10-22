import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PayoutsPage from './payouts.vue';

vi.mock('./_components/payout-history.vue', () => ({
  default: {
    name: 'PayoutHistoryStub',
    template: '<div data-testid="payout-history-stub" />',
  },
}));

describe('payouts page', () => {
  it('renders the page shell around the payout history list', async () => {
    const wrapper = await mountSuspended(PayoutsPage);

    expect(wrapper.get('h1').text()).toBe('Payouts');
    expect(wrapper.text()).toContain('Transfers from your Seller Payable to your Payout Account, scheduled or requested manually.');
    expect(wrapper.find('[data-testid="payout-history-stub"]').exists()).toBe(true);
  });
});
