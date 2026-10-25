import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';
import type { Country } from '~/domains/location/api/contracts/location.contract';
import StatusBadge from '@arc/ui/primitives/status-badge.vue';
import PayoutAccountCard from './payout-account-card.vue';

const {
  accountState,
  onboardingState,
  startOnboarding,
  refetch,
  countriesState,
} = vi.hoisted(() => ({
  accountState: {
    account: { value: null as ShopFinancePayoutAccount | null },
    isPending: { value: false },
    isError: { value: false },
  },
  onboardingState: { isPending: { value: false } },
  startOnboarding: vi.fn(),
  refetch: vi.fn(),
  countriesState: {
    data: [
      { Iso2: 'US', name: 'United States' },
      { Iso2: 'CY', name: 'Cyprus' },
    ] as Country[] | undefined,
  },
}));

vi.mock('~/domains/location/queries/countries.query', async () => {
  // `vi.mock` factories are hoisted above this module's imports, so `vue` has
  // to be loaded inside the factory rather than statically.
  const { computed } = await import('vue');

  return {
    useGetCountries: () => ({
      data: computed(() => (countriesState.data ? { data: countriesState.data } : undefined)),
    }),
  };
});

vi.mock('~/domains/shop/queries/payout-account.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed, ref } = await import('vue');

  accountState.account = ref(null) as typeof accountState.account;
  accountState.isPending = ref(false) as typeof accountState.isPending;
  accountState.isError = ref(false) as typeof accountState.isError;
  onboardingState.isPending = ref(false) as typeof onboardingState.isPending;

  return {
    useShopFinancePayoutAccount: () => ({
      data: computed(() => (accountState.isError.value
        ? undefined
        : { payout_account: accountState.account.value })),
      isPending: computed(() => accountState.isPending.value),
      isError: computed(() => accountState.isError.value),
      refetch,
    }),
    useStartShopFinancePayoutAccountOnboarding: () => ({
      mutateAsync: startOnboarding,
      isPending: onboardingState.isPending,
    }),
  };
});

let wrapper: VueWrapper | undefined;
const assign = vi.fn();

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

async function render(overrides: {
  account?: ShopFinancePayoutAccount | null
  isPending?: boolean
  isError?: boolean
} = {}) {
  accountState.account.value = overrides.account === undefined ? account() : overrides.account;
  accountState.isPending.value = overrides.isPending ?? false;
  accountState.isError.value = overrides.isError ?? false;

  wrapper = await mountSuspended(PayoutAccountCard);
  await flushPromises();

  return wrapper;
}

function buttonWithLabel(label: string) {
  const button = wrapper!.findAll('button').find(candidate => candidate.text().includes(label));
  expect(button).toBeDefined();
  return button!;
}

describe('payout account card', () => {
  beforeEach(() => {
    assign.mockReset();
    onboardingState.isPending.value = false;
    countriesState.data = [
      { Iso2: 'US', name: 'United States' },
      { Iso2: 'CY', name: 'Cyprus' },
    ];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    startOnboarding.mockReset();
    refetch.mockReset();
    wrapper?.unmount();
    wrapper = undefined;
  });

  it('offers Stripe setup when the shop has no payout account', async () => {
    const card = await render({ account: null });

    expect(card.text()).toContain('Get paid with Stripe');
    expect(buttonWithLabel('Set up payouts with Stripe').exists()).toBe(true);
    expect(card.text()).not.toContain('Finish setup');
  });

  it('shows the setup empty state for an onboarding account', async () => {
    startOnboarding.mockResolvedValue({
      url: 'https://connect.stripe.com/setup/e/acct_1/abc',
      status: 'onboarding',
    });
    vi.stubGlobal('location', { assign });

    const card = await render({ account: account({ status: 'onboarding' }) });

    expect(card.text()).toContain('Set up payouts with Stripe');
    expect(card.text()).toContain('Stripe still needs your details and bank account');
    expect(card.text()).not.toContain('Payout account');
    expect(card.text()).not.toContain('Finish setup');
    buttonWithLabel('Continue with Stripe').trigger('click');
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });
    expect(assign).toHaveBeenCalledWith('https://connect.stripe.com/setup/e/acct_1/abc');
    expect(refetch).not.toHaveBeenCalled();
  });

  it('polls while Stripe still owns the status, then stops once it settles', async () => {
    vi.useFakeTimers();

    try {
      refetch.mockImplementation(async () => {
        accountState.account.value = account();
      });

      const card = await render({ account: account({ status: 'onboarding' }) });
      expect(card.text()).toContain('Stripe still needs your details and bank account');

      await vi.advanceTimersByTimeAsync(10_000);
      await flushPromises();

      expect(refetch).toHaveBeenCalledTimes(1);
      expect(card.text()).toContain('Payout account');
      expect(card.text()).toContain('to an account in United States.');

      await vi.advanceTimersByTimeAsync(30_000);

      expect(refetch).toHaveBeenCalledTimes(1);
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('does not poll before Stripe has an account to report on', async () => {
    vi.useFakeTimers();

    try {
      const card = await render({ account: null });

      await vi.advanceTimersByTimeAsync(30_000);
      await flushPromises();

      expect(refetch).not.toHaveBeenCalled();
      expect(card.text()).toContain('Get paid with Stripe');
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('refetches when the tab regains focus while onboarding', async () => {
    refetch.mockImplementation(async () => {
      accountState.account.value = account();
    });

    const card = await render({
      account: account({ status: 'action_required', payouts_enabled: false }),
    });

    window.dispatchEvent(new Event('focus'));
    await flushPromises();

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(card.text()).toContain('Payout account');
  });

  it('resumes an action-required account through onboarding', async () => {
    startOnboarding.mockResolvedValue({ url: null, status: 'active' });
    refetch.mockImplementation(async () => {
      accountState.account.value = account();
    });

    const card = await render({
      account: account({
        status: 'action_required',
        payouts_enabled: false,
      }),
    });

    expect(card.text()).toContain('Action required');
    buttonWithLabel('Finish setup').trigger('click');
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });
    expect(refetch).toHaveBeenCalled();
    expect(card.text()).toContain('Payout account');
    expect(card.text()).not.toContain('Ready to receive payouts');
  });

  it('refreshes the status when setup returns no hosted URL', async () => {
    startOnboarding.mockResolvedValue({ url: null, status: 'active' });
    refetch.mockImplementation(async () => {
      accountState.account.value = account({
        provider: 'manual_bank',
        provider_account_id: null,
      });
    });

    const card = await render({ account: account({ status: 'action_required' }) });
    buttonWithLabel('Finish setup').trigger('click');
    await flushPromises();

    expect(assign).not.toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
    expect(card.text()).toContain('Payout account');
    expect(card.text()).toContain('to an account in United States.');
  });

  it('describes an active account', async () => {
    const card = await render();

    expect(card.text()).toContain('Payout account');
    expect(card.text()).not.toContain('Active');
    expect(card.text()).toContain('to an account in United States.');
    const currencyBadge = card
      .findAllComponents(StatusBadge)
      .find(badge => badge.props('label') === 'USD');
    expect(currencyBadge?.props('color')).toBe('gray');
    expect(card.text()).not.toContain('Ready to receive payouts');
    expect(card.text()).not.toContain('acct_1');
    expect(card.text()).not.toContain('Finish setup');
  });

  it('shows the bank name and last four when Stripe reports them', async () => {
    const card = await render({
      account: account({ bank_name: 'Chase', last4: '6789' }),
    });

    expect(card.text()).toContain('Chase •••• 6789');
    expect(card.text()).toContain('· United States');
    expect(card.text()).not.toContain('Ready to receive payouts');
    expect(card.text()).not.toContain('acct_1');
    expect(card.text()).not.toContain('to an account in United States.');
  });

  it('falls back to the country code until the country list loads', async () => {
    countriesState.data = undefined;

    const card = await render();

    expect(card.text()).toContain('to an account in US.');
    expect(card.text()).not.toContain('United States');
  });

  it('explains what a restricted account still needs and lets the seller fix it', async () => {
    startOnboarding.mockResolvedValue({
      url: 'https://connect.stripe.com/setup/e/acct_1/restricted',
      status: 'restricted',
    });
    vi.stubGlobal('location', { assign });

    const card = await render({
      account: account({
        status: 'restricted',
        payouts_enabled: false,
        requirements: {
          currently_due: ['external_account', 'individual.verification.document'],
          disabled_reason: 'requirements.past_due',
        },
      }),
    });

    expect(card.text()).toContain('Restricted');
    expect(card.text()).toContain('Some of your details are overdue.');
    expect(card.text()).toContain('Stripe needs more information before payouts can resume.');
    expect(card.text()).toContain('your bank account details');
    expect(card.text()).toContain('a photo ID to verify your identity');
    expect(card.text()).toContain('Contact support');
    expect(card.text()).not.toContain('Payout account');
    buttonWithLabel('Update details').trigger('click');
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });
    expect(assign).toHaveBeenCalledWith(
      'https://connect.stripe.com/setup/e/acct_1/restricted',
    );
    expect(refetch).not.toHaveBeenCalled();
  });

  it('keeps the restricted card visible until the hosted redirect navigates', async () => {
    vi.stubGlobal('location', { assign });

    const { promise: onboardingPromise, resolve: resolveOnboarding } = Promise.withResolvers<{
      url: string
      status: string
    }>();
    startOnboarding.mockImplementation(() => {
      onboardingState.isPending.value = true;

      return onboardingPromise;
    });

    const card = await render({
      account: account({
        status: 'restricted',
        payouts_enabled: false,
        requirements: {
          currently_due: ['external_account', 'individual.verification.document'],
          disabled_reason: 'requirements.past_due',
        },
      }),
    });

    await buttonWithLabel('Update details').trigger('click');
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });
    expect(card.text()).toContain('Restricted');
    expect(card.text()).toContain('Stripe needs more information before payouts can resume.');
    expect(card.text()).toContain('your bank account details');
    expect(card.text()).not.toContain('Set up payouts with Stripe');
    expect(buttonWithLabel('Update details').attributes('disabled')).toBeDefined();
    expect(assign).not.toHaveBeenCalled();

    // The POST lands and the query now reports the account as onboarding.
    accountState.account.value = account({ status: 'onboarding' });
    await flushPromises();

    expect(card.text()).toContain('Restricted');
    expect(card.text()).not.toContain('Set up payouts with Stripe');
    expect(buttonWithLabel('Update details').attributes('disabled')).toBeDefined();

    onboardingState.isPending.value = false;
    resolveOnboarding({
      url: 'https://connect.stripe.com/setup/e/acct_1/restricted',
      status: 'onboarding',
    });
    await flushPromises();

    expect(assign).toHaveBeenCalledWith(
      'https://connect.stripe.com/setup/e/acct_1/restricted',
    );
    expect(card.text()).toContain('Restricted');
    expect(card.text()).toContain('Stripe needs more information before payouts can resume.');
    expect(card.text()).not.toContain('Set up payouts with Stripe');
    expect(buttonWithLabel('Update details').attributes('disabled')).toBeDefined();
  });

  it('returns to the live account when onboarding fails to start', async () => {
    const { promise: onboardingPromise, reject: rejectOnboarding } = Promise.withResolvers<never>();
    startOnboarding.mockImplementation(() => {
      onboardingState.isPending.value = true;

      return onboardingPromise;
    });

    const card = await render({
      account: account({
        status: 'restricted',
        payouts_enabled: false,
        requirements: {
          currently_due: ['external_account'],
          disabled_reason: 'requirements.past_due',
        },
      }),
    });

    await buttonWithLabel('Update details').trigger('click');
    await flushPromises();
    expect(card.text()).toContain('Update details');

    // The backend already moved the row, then the request failed.
    accountState.account.value = account({ status: 'onboarding' });
    onboardingState.isPending.value = false;
    rejectOnboarding(new Error('Stripe is unavailable'));
    await flushPromises();

    expect(card.text()).toContain('Set up payouts with Stripe');
    expect(card.text()).not.toContain('Contact support');
    expect(buttonWithLabel('Continue with Stripe').attributes('disabled')).toBeUndefined();
    expect(buttonWithLabel('Continue with Stripe').attributes('loading')).toBeUndefined();
  });

  it('explains a disabled account', async () => {
    const card = await render({
      account: account({
        status: 'disabled',
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          disabled_reason: 'rejected.fraud',
        },
      }),
    });

    expect(card.text()).toContain('Disabled');
    expect(card.text()).toContain('Stripe could not approve payouts for this account.');
    expect(card.text()).toContain('Contact support');
    expect(card.text()).not.toContain('Payout account');
    expect(card.text()).not.toContain('Update details');
    expect(card.find('button').exists()).toBe(false);
  });

  it('owns its loading state', async () => {
    const card = await render({ isPending: true });

    expect(card.text()).not.toContain('Payout account');
    expect(card.find('button').exists()).toBe(false);
  });

  it('owns its error state', async () => {
    const card = await render({ isError: true });

    expect(card.text()).toContain('Unable to load payout account');
  });
});
