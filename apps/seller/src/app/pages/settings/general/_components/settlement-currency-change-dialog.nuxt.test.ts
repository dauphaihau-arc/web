import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import type { ShopFinanceSettlementCurrency } from '~/domains/shop/api/finance/contracts/settlement-currency.contract';
import SettlementCurrencyChangeDialog from './settlement-currency-change-dialog.vue';

const { mutateAsync, refetchEligibility, eligibilityState } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  refetchEligibility: vi.fn(),
  eligibilityState: { current: null as Partial<ShopFinanceSettlementCurrency> | null },
}));

vi.mock('~/domains/shop/queries/settlement-currency.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinanceSettlementCurrency: () => ({
      data: computed(() => eligibilityState.current),
      refetch: refetchEligibility,
    }),
  };
});

vi.mock('~/domains/shop/mutations/change-settlement-currency.mutation', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { ref } = await import('vue');

  return {
    useChangeShopFinanceSettlementCurrency: () => ({
      mutateAsync,
      isPending: ref(false),
    }),
  };
});

type DialogProps = {
  currency: string
  nextChangeAllowedAt?: string | null
  canChange?: boolean
  blockedReason?: 'balance_not_zero' | 'payout_pending' | 'change_too_soon' | null
};

let wrapper: VueWrapper | undefined;

async function render(props: DialogProps = { currency: 'USD' }) {
  wrapper = await mountSuspended(SettlementCurrencyChangeDialog, {
    props: {
      canChange: true,
      blockedReason: null,
      ...props,
    },
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

function currentCurrencyTrigger() {
  const trigger = document.body.querySelector('[data-testid="settlement-currency-select"]');
  expect(trigger).toBeDefined();
  return trigger as HTMLButtonElement;
}

async function chooseCurrency(currency: string) {
  currentCurrencyTrigger().click();
  await flushPromises();

  const option = [...document.body.querySelectorAll('li')].find(candidate => (
    candidate.textContent?.includes(currency)
  ));
  expect(option).toBeDefined();
  // HeadlessUI's ComboboxOption selects from its `mousedown` handler.
  option!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
  await flushPromises();
}

async function confirm() {
  buttonWithLabel('Change shop currency').click();
  await flushPromises();
}

describe('settlement currency change dialog', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    refetchEligibility.mockReset();
    eligibilityState.current = null;
    mutateAsync.mockResolvedValue({
      currency: 'EUR',
      previous_currency: 'USD',
      effective_from: '2026-10-22T09:30:00.000Z',
      auto_payout_enabled: false,
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('explains what the change does before confirming', async () => {
    await render();

    expect(bodyText()).toContain('Existing payouts stay exactly as they are.');
    expect(bodyText()).toContain('Auto payout will be turned off');
    expect(bodyText()).toContain('your current USD account can no longer be used');
    expect(bodyText()).toContain('add and verify an account in the new currency to turn payouts back on');
    expect(bodyText()).toContain('Product prices and promotions are not changed');
  });

  it('starts with the current currency selected and keeps the change disabled', async () => {
    await render();

    expect(currentCurrencyTrigger().textContent).toContain('United States Dollar (USD)');
    expect(currentCurrencyTrigger().disabled).toBe(false);
    expect(buttonWithLabel('Change shop currency').disabled).toBe(true);

    await chooseCurrency('EUR');

    expect(currentCurrencyTrigger().textContent).toContain('Euro (EUR)');
    expect(buttonWithLabel('Change shop currency').disabled).toBe(false);
  });

  it('changes the currency and prompts for a payout account in the new one', async () => {
    await render({ currency: 'USD', nextChangeAllowedAt: '2027-01-20T09:30:00.000Z' });

    expect(bodyText()).toContain('Next change: Jan 20, 2027');

    await chooseCurrency('EUR');
    await confirm();

    expect(mutateAsync).toHaveBeenCalledWith({ currency: 'EUR' });
    expect(bodyText()).toContain('Your shop now uses EUR.');
    expect(bodyText()).toContain('Set up a payout account in EUR before payouts can resume.');
    expect(bodyText()).toContain('Orders placed before Oct 22, 2026 keep their original currency');
    expect(bodyText()).not.toContain('2026-10-22T09:30:00.000Z');
    expect(bodyText()).toContain('Add payout account');
    expect(bodyText()).not.toContain('Auto payout will be turned off');
  });

  it('renders the dropdown inside the dialog panel', async () => {
    await render();

    currentCurrencyTrigger().click();
    await flushPromises();

    const listbox = document.body.querySelector('[role="listbox"]');
    expect(listbox).not.toBeNull();
    expect(listbox!.closest('[role="dialog"]')).not.toBeNull();
  });

  it('refreshes the eligibility when it opens', async () => {
    await render();

    expect(refetchEligibility).toHaveBeenCalled();
  });

  it('keeps the dialog open and explains a refused change', async () => {
    mutateAsync.mockRejectedValueOnce({
      data: { code: 'SETTLEMENT_CURRENCY_BALANCE_NOT_ZERO' },
    });
    await render();

    await chooseCurrency('EUR');
    await confirm();

    expect(bodyText()).toContain('Your balance must be zero before you can change your shop currency');
    expect(bodyText()).toContain('Unable to change shop currency');
    expect(bodyText()).toContain('Auto payout will be turned off');
  });

  it('keeps the action disabled when the refreshed data says the change is blocked', async () => {
    eligibilityState.current = {
      can_change: false,
      blocked_reason: 'balance_not_zero',
      next_change_allowed_at: null,
    };
    await render({ currency: 'USD', canChange: true });

    expect(bodyText()).toContain('Your balance must be zero before you can change your shop currency');
    expect(buttonWithLabel('Change shop currency').disabled).toBe(true);
  });

  it('disables the change and explains a non-zero balance', async () => {
    await render({ currency: 'USD', canChange: false, blockedReason: 'balance_not_zero' });

    expect(bodyText()).toContain('Your balance must be zero before you can change your shop currency');
    expect(buttonWithLabel('Change shop currency').disabled).toBe(true);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('disables the change and explains a pending payout', async () => {
    await render({ currency: 'USD', canChange: false, blockedReason: 'payout_pending' });

    expect(bodyText()).toContain('A payout is still pending. Wait for it to finish, then change your shop currency');
    expect(buttonWithLabel('Change shop currency').disabled).toBe(true);
  });

  it('disables the change and shows when a change becomes allowed again', async () => {
    await render({
      currency: 'USD',
      canChange: false,
      blockedReason: 'change_too_soon',
      nextChangeAllowedAt: '2027-01-20T09:30:00.000Z',
    });

    expect(bodyText()).toContain('Next change: Jan 20, 2027');
    expect(buttonWithLabel('Change shop currency').disabled).toBe(true);
  });
});
