import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';
import PayoutAccountCard from './payout-account-card.vue';

const { accountState } = vi.hoisted(() => ({
  accountState: {
    account: null as ShopFinancePayoutAccount | null,
    isPending: false,
    isError: false,
  },
}));

vi.mock('~/domains/shop/queries/payout-account.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    useShopFinancePayoutAccount: () => ({
      data: computed(() => (accountState.isError ? undefined : { payout_account: accountState.account })),
      isPending: computed(() => accountState.isPending),
      isError: computed(() => accountState.isError),
    }),
  };
});

function account(overrides: Partial<ShopFinancePayoutAccount> = {}): ShopFinancePayoutAccount {
  return {
    id: 'pa_1',
    holder_name: 'Ada Lovelace',
    bank_name: 'Analytical Bank',
    last4: '4242',
    country: 'US',
    currency: 'USD',
    status: 'active',
    verified_at: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

async function render(
  overrides: Partial<typeof accountState> = {},
) {
  accountState.account = overrides.account === undefined ? account() : overrides.account;
  accountState.isPending = overrides.isPending ?? false;
  accountState.isError = overrides.isError ?? false;

  return mountSuspended(PayoutAccountCard);
}

describe('payout account card', () => {
  it('shows the account details', async () => {
    const wrapper = await render();

    expect(wrapper.text()).toContain('Payout account');
    expect(wrapper.text()).toContain('Analytical Bank ••4242');
    expect(wrapper.text()).not.toContain('Ada Lovelace');
    expect(wrapper.text()).toContain('Active');
  });

  it('owns its loading state', async () => {
    const wrapper = await render({ isPending: true });

    expect(wrapper.text()).not.toContain('Payout account');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('owns its error state', async () => {
    const wrapper = await render({ isError: true });

    expect(wrapper.text()).toContain('Unable to load payout account');
  });

  it('owns the no-account state', async () => {
    const wrapper = await render({ account: null });

    expect(wrapper.text()).toContain('No payout account yet');
    expect(wrapper.text()).toContain('Add bank account');
  });
});
