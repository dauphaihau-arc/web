import {
  describe, expect, it, vi,
} from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';
import PayableCard from './payable-card.vue';

const { cardState, openModal } = vi.hoisted(() => ({
  openModal: vi.fn(),
  cardState: {
    availableMinor: 12_500,
    isPending: false,
    isError: false,
    payoutAccount: null as ShopFinancePayoutAccount | null,
    hasPendingPayout: false,
    remaining: 1 as number | null | undefined,
  },
}));

mockNuxtImport('useModal', () => () => ({ open: openModal, close: vi.fn() }));

vi.mock('~/domains/shop/queries/finance-payable.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    useShopFinancePayable: () => ({
      data: computed(() => (cardState.isError
        ? undefined
        : {
          currency: 'USD',
          available_minor: cardState.availableMinor,
          not_yet_available_minor: 0,
        })),
      isPending: computed(() => cardState.isPending),
      isError: computed(() => cardState.isError),
    }),
  };
});

vi.mock('~/domains/shop/queries/payout-account.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayoutAccount: () => ({
      data: computed(() => ({ payout_account: cardState.payoutAccount })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/payouts.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayouts: () => ({
      data: computed(() => ({
        payouts: cardState.hasPendingPayout ? [{ state: 'pending' }] : [],
      })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/payout-settings.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayoutSettings: () => ({
      data: computed(() => (cardState.remaining === undefined
        ? undefined
        : {
          auto_payout_enabled: false,
          auto_payout_day_of_month: 15,
          auto_payout_eligible: true,
          auto_payout_ineligible_reason: null,
          manual_withdrawals_remaining: cardState.remaining,
        })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

function account(overrides: Partial<ShopFinancePayoutAccount> = {}): ShopFinancePayoutAccount {
  return {
    id: 'pa_1',
    provider: 'stripe_connect',
    provider_account_id: 'acct_1',
    country: 'US',
    currency: 'USD',
    status: 'active',
    payouts_enabled: true,
    charges_enabled: true,
    transfers_capability: 'active',
    requirements: { currently_due: [], disabled_reason: null },
    default_currency: 'USD',
    bank_name: null,
    last4: null,
    ...overrides,
  };
}

type RenderOptions = {
  availableMinor?: number
  remaining?: number | null
  remainingUnset?: boolean
  payoutAccount?: ShopFinancePayoutAccount | null
  hasPendingPayout?: boolean
  isPending?: boolean
  isError?: boolean
};

async function render(overrides: RenderOptions = {}) {
  cardState.availableMinor = overrides.availableMinor ?? 12_500;
  cardState.isPending = overrides.isPending ?? false;
  cardState.isError = overrides.isError ?? false;
  cardState.payoutAccount = overrides.payoutAccount === undefined ? account() : overrides.payoutAccount;
  cardState.hasPendingPayout = overrides.hasPendingPayout ?? false;
  cardState.remaining = overrides.remainingUnset ? undefined : (overrides.remaining ?? 1);

  return mountSuspended(PayableCard);
}

describe('payable card', () => {
  it('offers an enabled withdrawal below the balance when the shop may withdraw', async () => {
    const button = (await render()).find('button');

    expect(button.text()).toContain('Withdraw now');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('owns its loading state', async () => {
    const wrapper = await render({ isPending: true });

    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Available');
  });

  it('owns its error state', async () => {
    const wrapper = await render({ isError: true });

    expect(wrapper.text()).toContain('Unable to load balance');
    expect(wrapper.text()).toContain('Reload the page to try again.');
  });

  it('disables the button without a tooltip when nothing is available', async () => {
    const wrapper = await render({ availableMinor: 0 });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[aria-label="Why withdrawal is unavailable"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('nothing available');
  });

  it('disables the button and explains a used monthly withdrawal', async () => {
    const wrapper = await render({ remaining: 0 });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[aria-label="Why withdrawal is unavailable"]').exists()).toBe(true);
  });

  it('disables the button and explains a pending payout', async () => {
    const wrapper = await render({ hasPendingPayout: true });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[aria-label="Why withdrawal is unavailable"]').exists()).toBe(true);
  });

  it('disables the button and explains an unusable payout account', async () => {
    const withoutAccount = await render({ payoutAccount: null });
    const unverified = await render({
      payoutAccount: account({ status: 'onboarding', payouts_enabled: false }),
    });

    expect(withoutAccount.find('button').attributes('disabled')).toBeDefined();
    expect(withoutAccount.find('[aria-label="Why withdrawal is unavailable"]').exists()).toBe(true);
    expect(unverified.find('button').attributes('disabled')).toBeDefined();
    expect(unverified.find('[aria-label="Why withdrawal is unavailable"]').exists()).toBe(true);
  });

  it('disables and loads without a tooltip while the allowance loads', async () => {
    const wrapper = await render({ remainingUnset: true });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[aria-label="Why withdrawal is unavailable"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('still loading');
  });

  it('opens the withdrawal dialog in the payout account currency', async () => {
    openModal.mockReset();
    const wrapper = await render({ payoutAccount: account({ default_currency: 'EUR' }) });

    await wrapper.find('button').trigger('click');

    expect(openModal).toHaveBeenCalledWith(expect.anything(), {
      availableMinor: 12_500,
      currency: 'USD',
      targetCurrency: 'EUR',
    });
  });

  it('opens the withdrawal dialog in the balance currency without an account currency', async () => {
    openModal.mockReset();
    const wrapper = await render({ payoutAccount: account({ default_currency: null }) });

    await wrapper.find('button').trigger('click');

    expect(openModal).toHaveBeenCalledWith(expect.anything(), {
      availableMinor: 12_500,
      currency: 'USD',
      targetCurrency: 'USD',
    });
  });
});
