import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import ManualPayoutDialog from './manual-payout-dialog.vue';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('~/domains/shop/mutations/request-manual-payout.mutation', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { ref } = await import('vue');

  return {
    useRequestShopFinanceManualPayout: () => ({
      mutateAsync,
      isPending: ref(false),
    }),
  };
});

let wrapper: VueWrapper | undefined;

async function render() {
  wrapper = await mountSuspended(ManualPayoutDialog, {
    props: { availableMinor: 5_000, currency: 'USD' },
    attrs: { modelValue: true },
  });
  await flushPromises();

  return wrapper;
}

/** The dialog content is teleported into the body by the modal overlay. */
function amountInput() {
  const input = document.body.querySelector('input');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
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

async function setAmount(value: string) {
  const input = amountInput();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flushPromises();
}

async function submit() {
  buttonWithLabel('Withdraw').click();
  await flushPromises();
}

describe('manual payout dialog', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({ payout: { id: 'pay_1' } });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('prefills the available balance in major units and withdraws all by default', async () => {
    await render();

    expect(amountInput().value).toBe('50.00');
    expect(bodyText()).toContain('$50.00');
    expect(bodyText()).toContain('USD');

    await submit();

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({});
  });

  it('converts the entered major amount to minor units for the API', async () => {
    await render();

    await setAmount('25');
    await submit();

    expect(mutateAsync).toHaveBeenCalledWith({ amount_minor: 2_500 });
  });

  it('caps an amount above the available balance at the available balance', async () => {
    await render();

    await setAmount('60');
    expect(amountInput().value).toBe('50.00');

    await submit();

    expect(mutateAsync).toHaveBeenCalledWith({});
  });

  it('disables the withdraw action when the amount is empty', async () => {
    await render();

    await setAmount('');

    expect(buttonWithLabel('Withdraw').disabled).toBe(true);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('disables the withdraw action when the amount is zero', async () => {
    await render();

    await setAmount('0');

    expect(buttonWithLabel('Withdraw').disabled).toBe(true);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('caps a negative amount at zero and disables the withdraw action', async () => {
    await render();

    await setAmount('-1');
    expect(amountInput().value).toBe('0');
    expect(buttonWithLabel('Withdraw').disabled).toBe(true);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('shows a named API rejection inline', async () => {
    mutateAsync.mockRejectedValueOnce({
      data: {
        code: 'MANUAL_PAYOUT_ALREADY_USED',
        message: 'Already used',
      },
    });

    await render();
    await submit();

    expect(bodyText()).toContain('You have already made your manual withdrawal this month.');
  });

  it('falls back to the server message for an unknown rejection', async () => {
    mutateAsync.mockRejectedValueOnce({
      data: {
        code: 'SOMETHING_ELSE',
        message: 'The payout provider is unavailable.',
      },
    });

    await render();
    await submit();

    expect(bodyText()).toContain('The payout provider is unavailable.');
  });
});
