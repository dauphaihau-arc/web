import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { computed as makeComputed, ref as makeRef } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract';
import PayoutAccountDialog from './payout-account-dialog.vue';

const {
  startOnboarding,
  refetch,
  usePayoutCountries,
  pendingOnboarding,
} = vi.hoisted(() => ({
  startOnboarding: vi.fn(),
  refetch: vi.fn(),
  usePayoutCountries: vi.fn(),
  pendingOnboarding: { current: null as null | { value: boolean } },
}));

function allowedCountries(codes: string[], isError = false) {
  return {
    data: isError ? makeRef(undefined) : makeComputed(() => ({ countries: codes })),
    isError: makeRef(isError),
  };
}

vi.mock('~/domains/shop/queries/payout-account.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { ref } = await import('vue');

  return {
    useShopFinancePayoutAccount: () => ({ refetch }),
    useShopFinancePayoutAccountCountries: usePayoutCountries,
    useStartShopFinancePayoutAccountOnboarding: () => {
      pendingOnboarding.current = ref(false);

      return {
        mutateAsync: startOnboarding,
        isPending: pendingOnboarding.current,
      };
    },
  };
});

vi.mock('~/domains/location/queries/countries.query', async () => {
  const { computed } = await import('vue');

  return {
    useGetCountries: () => ({
      data: computed(() => ({
        data: [
          { Iso2: 'US', name: 'United States' },
          { Iso2: 'VN', name: 'Vietnam' },
          { Iso2: 'GB', name: 'United Kingdom' },
        ],
      })),
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
    status: 'onboarding',
    payouts_enabled: false,
    charges_enabled: true,
    transfers_capability: 'pending',
    requirements: { currently_due: [], disabled_reason: null },
    default_currency: 'USD',
    bank_name: null,
    last4: null,
    ...overrides,
  };
}

async function render(props: { account?: ShopFinancePayoutAccount | null } = {}) {
  wrapper = await mountSuspended(PayoutAccountDialog, {
    props,
    attrs: { modelValue: true },
  });
  await flushPromises();

  return wrapper;
}

function bodyText() {
  return document.body.textContent ?? '';
}

function buttonWithLabel(label: string) {
  const button = [...document.body.querySelectorAll('button')].find(candidate => (
    candidate.textContent?.includes(label)
  ));
  expect(button).toBeDefined();
  return button!;
}

function selectTrigger(testId: string) {
  const trigger = document.body.querySelector(`[data-testid="${testId}"]`);
  expect(trigger).not.toBeNull();
  return trigger as HTMLButtonElement;
}

async function chooseOption(testId: string, label: string) {
  selectTrigger(testId).click();
  await flushPromises();

  const option = [...document.body.querySelectorAll('li')].find(candidate => (
    candidate.textContent?.trim() === label
  ));
  expect(option).toBeDefined();
  // HeadlessUI's ComboboxOption selects from its `mousedown` handler; the click
  // keeps the selection working for an option that mounts during the open
  // transition.
  option!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
  option!.click();
  await flushPromises();
}

describe('payout account dialog', () => {
  beforeEach(() => {
    assign.mockReset();
    pendingOnboarding.current = null;
    usePayoutCountries.mockReturnValue(allowedCountries(['US', 'GB']));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    startOnboarding.mockReset();
    refetch.mockReset();
    usePayoutCountries.mockReset();
    pendingOnboarding.current = null;
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('asks for the payout country before starting Stripe onboarding', async () => {
    await render();

    expect(bodyText()).toContain('Country where you\'ll receive payouts');
    expect(bodyText()).toContain('We\'ll take you to Stripe to add your details and bank account.');
    expect(bodyText()).toContain('Payouts are sent straight to that account.');
    expect(buttonWithLabel('Continue to Stripe').disabled).toBe(true);
    expect(startOnboarding).not.toHaveBeenCalled();
  });

  it('starts onboarding in the chosen country and leaves for the hosted flow', async () => {
    startOnboarding.mockResolvedValue({
      url: 'https://connect.stripe.com/setup/e/acct_1/abc',
      status: 'onboarding',
    });
    vi.stubGlobal('location', { assign });

    await render();
    await chooseOption('payout-account-country', 'United States');
    buttonWithLabel('Continue to Stripe').click();
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });
    expect(assign).toHaveBeenCalledWith('https://connect.stripe.com/setup/e/acct_1/abc');
    expect(refetch).not.toHaveBeenCalled();
  });

  it('keeps the country picker and both actions locked from submit until the redirect', async () => {
    const onboarding = Promise.withResolvers<{ url: string, status: string }>();
    startOnboarding.mockImplementation(() => onboarding.promise);
    vi.stubGlobal('location', { assign });

    await render();
    await chooseOption('payout-account-country', 'United States');
    buttonWithLabel('Continue to Stripe').click();
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });

    const pending = pendingOnboarding.current!;
    pending.value = true;
    await flushPromises();

    expect(selectTrigger('payout-account-country').disabled).toBe(true);
    expect(buttonWithLabel('Continue to Stripe').disabled).toBe(true);
    expect(buttonWithLabel('Cancel').disabled).toBe(true);

    onboarding.resolve({ url: 'https://connect.stripe.com/setup/e/acct_1/abc', status: 'onboarding' });
    await flushPromises();

    expect(assign).toHaveBeenCalledWith('https://connect.stripe.com/setup/e/acct_1/abc');

    // The mutation has settled, but the browser is still leaving for Stripe,
    // so the controls must not re-enable.
    pending.value = false;
    await flushPromises();

    expect(selectTrigger('payout-account-country').disabled).toBe(true);
    expect(buttonWithLabel('Continue to Stripe').disabled).toBe(true);
    expect(buttonWithLabel('Cancel').disabled).toBe(true);
  });

  it('re-enables the controls when onboarding fails without a redirect', async () => {
    startOnboarding.mockRejectedValueOnce({
      data: {
        code: 'PAYOUT_ACCOUNT_COUNTRY_UNSUPPORTED',
        message: 'PAYOUT_ACCOUNT_COUNTRY_UNSUPPORTED',
      },
    });
    vi.stubGlobal('location', { assign });

    await render();
    await chooseOption('payout-account-country', 'United States');
    buttonWithLabel('Continue to Stripe').click();
    await flushPromises();

    expect(assign).not.toHaveBeenCalled();
    expect(selectTrigger('payout-account-country').disabled).toBe(false);
    expect(buttonWithLabel('Continue to Stripe').disabled).toBe(false);
    expect(buttonWithLabel('Cancel').disabled).toBe(false);
  });

  it('uses the stored country for an account that already started onboarding', async () => {
    startOnboarding.mockResolvedValue({ url: null, status: 'active' });

    await render({ account: account() });

    expect(document.body.querySelector('[data-testid="payout-account-country"]')).toBeNull();
    expect(bodyText()).toContain('Your account is registered in United States.');
    buttonWithLabel('Continue to Stripe').click();
    await flushPromises();

    expect(startOnboarding).toHaveBeenCalledWith({ country: 'US' });
  });

  it('refreshes the account when onboarding returns no hosted URL', async () => {
    startOnboarding.mockResolvedValue({ url: null, status: 'active' });
    vi.stubGlobal('location', { assign });

    await render();
    await chooseOption('payout-account-country', 'United States');
    buttonWithLabel('Continue to Stripe').click();
    await flushPromises();

    expect(assign).not.toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
  });

  it('offers only countries in the allowlist, sorted by name', async () => {
    await render();

    selectTrigger('payout-account-country').click();
    await flushPromises();

    const options = [...document.body.querySelectorAll('li')]
      .map(option => option.textContent?.trim());

    expect(options).toEqual(['United Kingdom', 'United States']);
    expect(options).not.toContain('Vietnam');
  });

  it('does not offer a listed country that the allowlist excludes', async () => {
    usePayoutCountries.mockReturnValue(allowedCountries(['GB', 'VN']));

    await render();

    selectTrigger('payout-account-country').click();
    await flushPromises();

    const options = [...document.body.querySelectorAll('li')]
      .map(option => option.textContent?.trim());

    expect(options).toEqual(['United Kingdom', 'Vietnam']);
    expect(options).not.toContain('United States');
  });

  it('keeps submit guarded when the allowlist cannot be loaded', async () => {
    usePayoutCountries.mockReturnValue(allowedCountries([], true));

    await render();

    expect(bodyText()).toContain('Unable to load the countries where payouts are available.');
    expect(buttonWithLabel('Continue to Stripe').disabled).toBe(true);
    selectTrigger('payout-account-country').click();
    await flushPromises();
    expect(document.body.querySelectorAll('li')).toHaveLength(0);
    expect(startOnboarding).not.toHaveBeenCalled();
  });

  it('shows an unsupported country in plain words', async () => {
    usePayoutCountries.mockReturnValue(allowedCountries(['US', 'VN']));
    startOnboarding.mockRejectedValueOnce({
      data: {
        code: 'PAYOUT_ACCOUNT_COUNTRY_UNSUPPORTED',
        message: 'PAYOUT_ACCOUNT_COUNTRY_UNSUPPORTED',
      },
    });

    await render();
    await chooseOption('payout-account-country', 'Vietnam');
    buttonWithLabel('Continue to Stripe').click();
    await flushPromises();

    expect(bodyText()).toContain('Payouts are not available in that country yet.');
    expect(bodyText()).not.toContain('PAYOUT_ACCOUNT_COUNTRY_UNSUPPORTED');
    expect(assign).not.toHaveBeenCalled();
  });
});
