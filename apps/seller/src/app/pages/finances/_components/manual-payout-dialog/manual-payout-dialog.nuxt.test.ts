import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { formatMinorCurrency } from '@arc/utils';
import type {
  ShopFinancePayout,
  ShopFinancePayoutQuote,
} from '~/domains/shop/api/finance/contracts/payout.contract';
import ManualPayoutDialog from './manual-payout-dialog.vue';

const { modalClose, toastAdd } = vi.hoisted(() => ({
  modalClose: vi.fn(),
  toastAdd: vi.fn(),
}));

mockNuxtImport('useModal', () => () => ({ close: modalClose }));
mockNuxtImport('useToast', () => () => ({ add: toastAdd }));

const {
  mutateAsync, quoteState, patchQuoteState, fetchQuote,
} = vi.hoisted(() => {
  const state = {
    quote: null as ShopFinancePayoutQuote | null,
    isError: false,
    error: undefined as unknown,
    isFetching: false,
  };

  return {
    mutateAsync: vi.fn(),
    fetchQuote: vi.fn(),
    quoteState: state,
    /** Writes through the reactive copy the mocked query observes. */
    patchQuoteState: {} as {
      apply?: (patch: Partial<typeof state>) => void
    },
  };
});

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

vi.mock('~/domains/shop/queries/payout-quote.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed, reactive, watchEffect } = await import('vue');
  const state = reactive(quoteState);
  patchQuoteState.apply = patch => Object.assign(state, patch);

  return {
    // The real query only issues a request while the amount is positive, so
    // the mock records exactly the requests the real one would make.
    useShopFinancePayoutQuote: (amountMinor: { value: number }) => {
      watchEffect(() => {
        if (amountMinor.value > 0) {
          fetchQuote(amountMinor.value);
        }
      });

      return {
        data: computed(() => state.quote ?? undefined),
        isError: computed(() => state.isError),
        error: computed(() => state.error),
        isFetching: computed(() => state.isFetching),
      };
    },
  };
});

let wrapper: VueWrapper | undefined;

function buildQuote(overrides: Partial<ShopFinancePayoutQuote> = {}): ShopFinancePayoutQuote {
  return {
    source_currency: 'USD',
    target_currency: 'USD',
    source_amount_minor: 5_000,
    fx_rate: '1',
    target_amount_minor: 5_000,
    estimated: true,
    ...overrides,
  };
}

function buildPayout(overrides: Partial<ShopFinancePayout> = {}): ShopFinancePayout {
  return {
    id: 'pay_1',
    amount_minor: 5_000,
    currency: 'USD',
    source_currency: 'USD',
    target_currency: 'USD',
    fx_rate: '1',
    target_amount_minor: 5_000,
    provider_fx_rate: null,
    fx_fee_minor: 0,
    state: 'pending',
    source: 'manual',
    period: '2026-10',
    reason: null,
    paid_at: null,
    created_at: '2026-10-24T10:00:00.000Z',
    ...overrides,
  };
}

type RenderOptions = {
  availableMinor?: number
  currency?: string
  targetCurrency?: string
};

async function render(overrides: RenderOptions = {}) {
  wrapper = await mountSuspended(ManualPayoutDialog, {
    props: {
      availableMinor: overrides.availableMinor ?? 5_000,
      currency: overrides.currency ?? 'USD',
      targetCurrency: overrides.targetCurrency ?? 'USD',
    },
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

function quoteBody() {
  return document.body.querySelector('[data-testid="payout-quote-body"]');
}

/** The four quote rows expose Paid out, Rate and You receive as `dd`s. */
function quoteRowValues() {
  const panel = document.body.querySelector('[data-testid="payout-quote"]');
  expect(panel).not.toBeNull();

  return [...panel!.querySelectorAll('dd')].map(dd => dd.textContent?.trim() ?? '');
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
    mutateAsync.mockResolvedValue({ payout: buildPayout() });
    modalClose.mockReset();
    toastAdd.mockReset();
    fetchQuote.mockReset();
    quoteState.quote = buildQuote();
    quoteState.isError = false;
    quoteState.error = undefined;
    quoteState.isFetching = false;
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

  it('shows the server quote without computing the rate itself', async () => {
    quoteState.quote = buildQuote({
      source_amount_minor: 2_500,
      fx_rate: '25400.0000000000',
      target_currency: 'VND',
      target_amount_minor: 57_150_000,
    });

    await render({ targetCurrency: 'VND' });
    await setAmount('25');

    const quote = document.body.querySelector('[data-testid="payout-quote"]');
    expect(quote).not.toBeNull();

    const quoteText = quote!.textContent ?? '';
    expect(quoteText).toContain('Paid out');
    expect(quoteText).toContain(formatMinorCurrency(2_500, 'USD'));
    expect(quoteText).not.toContain('Fee');
    expect(quoteText).toContain('Rate');
    expect(quoteText).toContain('1 USD = 25,400 VND');
    expect(quoteText).toContain('You receive');
    expect(quoteText).toContain(formatMinorCurrency(57_150_000, 'VND'));
    expect(quoteText).toContain(
      'Estimated — the final amount is set when Stripe sends the transfer.',
    );
    expect(fetchQuote).toHaveBeenCalled();
  });

  it('keeps the quote panel with placeholders for an empty or invalid amount', async () => {
    quoteState.quote = null;

    await render({ targetCurrency: 'VND' });

    const panel = document.body.querySelector('[data-testid="payout-quote"]');
    expect(panel).not.toBeNull();
    expect(panel!.textContent).toContain('Paid out');
    expect(panel!.textContent).toContain('Rate');
    expect(panel!.textContent).toContain('You receive');

    await setAmount('');
    expect(quoteRowValues()).toEqual(['—', '—', '—']);

    await setAmount('0');
    expect(quoteRowValues()).toEqual(['—', '—', '—']);
    expect(document.body.querySelector('[data-testid="payout-quote"]')).not.toBeNull();
    expect(bodyText()).toContain(
      'Estimated — the final amount is set when Stripe sends the transfer.',
    );
  });

  it('keeps the previous figures while a new quote is fetched, then updates them', async () => {
    quoteState.quote = buildQuote({
      source_amount_minor: 5_000,
      fx_rate: '25400.0000000000',
      target_currency: 'VND',
      target_amount_minor: 127_000_000,
    });

    await render({ targetCurrency: 'VND' });

    expect(quoteRowValues()).toEqual([
      formatMinorCurrency(5_000, 'USD'),
      '1 USD = 25,400 VND',
      formatMinorCurrency(127_000_000, 'VND'),
    ]);
    expect(quoteBody()?.className).not.toContain('opacity-60');

    patchQuoteState.apply!({ isFetching: true });
    await flushPromises();

    expect(quoteBody()?.className).toContain('opacity-60');
    expect(quoteRowValues()).toEqual([
      formatMinorCurrency(5_000, 'USD'),
      '1 USD = 25,400 VND',
      formatMinorCurrency(127_000_000, 'VND'),
    ]);

    patchQuoteState.apply!({
      quote: buildQuote({
        source_amount_minor: 2_500,
        fx_rate: '25400.0000000000',
        target_currency: 'VND',
        target_amount_minor: 63_500_000,
      }),
      isFetching: false,
    });
    await flushPromises();

    expect(quoteRowValues()).toEqual([
      formatMinorCurrency(2_500, 'USD'),
      '1 USD = 25,400 VND',
      formatMinorCurrency(63_500_000, 'VND'),
    ]);
    expect(quoteBody()?.className).not.toContain('opacity-60');
  });

  it('neither previews nor quotes a payout into the balance currency', async () => {
    await render();

    expect(document.body.querySelector('[data-testid="payout-quote"]')).toBeNull();
    expect(bodyText()).not.toContain('Paid out');
    expect(bodyText()).not.toContain('Estimated');
    expect(fetchQuote).not.toHaveBeenCalled();
  });

  it('closes the dialog and confirms an identity withdrawal with a toast', async () => {
    await render();
    await submit();

    expect(modalClose).toHaveBeenCalledTimes(1);
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: `Withdrawal requested — ${formatMinorCurrency(5_000, 'USD')} paid out.`,
    }));
    expect(document.body.querySelector('[data-testid="withdrawal-receipt"]')).toBeNull();
    expect(bodyText()).not.toContain('Withdrawal requested');
  });

  it('shows the rate-unavailable quote rejection in plain words', async () => {
    quoteState.quote = null;
    quoteState.isError = true;
    quoteState.error = {
      data: {
        code: 'PAYOUT_CONVERSION_RATE_UNAVAILABLE',
        message: 'PAYOUT_CONVERSION_RATE_UNAVAILABLE',
      },
    };

    await render({ targetCurrency: 'VND' });

    expect(bodyText()).toContain('The exchange rate is unavailable right now. Try again in a moment.');
    expect(bodyText()).not.toContain('PAYOUT_CONVERSION_RATE_UNAVAILABLE');
  });

  it('shows the unusable payout account rejection in plain words', async () => {
    quoteState.quote = null;
    quoteState.isError = true;
    quoteState.error = {
      data: {
        code: 'PAYOUT_ACCOUNT_UNUSABLE',
        message: 'Payout account unusable',
      },
    };

    await render({ targetCurrency: 'VND' });

    expect(bodyText()).toContain('Add a payout account, or wait for the one you added to be verified, before withdrawing.');
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

  it('drops letters and symbols as they are typed', async () => {
    await render();

    await setAmount('abc');

    expect(amountInput().value).toBe('');
    expect(buttonWithLabel('Withdraw').disabled).toBe(true);
  });

  it('truncates the fraction to the currency decimal places', async () => {
    await render();

    await setAmount('25.555');
    expect(amountInput().value).toBe('25.55');

    await setAmount('25.5.5');
    expect(amountInput().value).toBe('25.55');
  });

  it('drops the fraction for a currency without decimal units', async () => {
    await render({ availableMinor: 5_000, currency: 'JPY', targetCurrency: 'JPY' });

    await setAmount('25.5');

    expect(amountInput().value).toBe('25');
  });

  it('submits a sanitized amount', async () => {
    await render();

    await setAmount('$25.00');

    expect(amountInput().value).toBe('25.00');

    await submit();

    expect(mutateAsync).toHaveBeenCalledWith({ amount_minor: 2_500 });
  });

  it('confirms a converted withdrawal with both sides in the toast', async () => {
    mutateAsync.mockResolvedValueOnce({
      payout: buildPayout({
        amount_minor: 2_500,
        source_currency: 'USD',
        target_currency: 'VND',
        fx_rate: '25400.0000000000',
        provider_fx_rate: '25010.0000000000',
        target_amount_minor: 57_150_000,
        fx_fee_minor: 0,
      }),
    });

    await render();
    await setAmount('25');
    await submit();

    expect(mutateAsync).toHaveBeenCalledWith({ amount_minor: 2_500 });
    expect(modalClose).toHaveBeenCalledTimes(1);
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Withdrawal requested — ' +
        `${formatMinorCurrency(2_500, 'USD')} → ${formatMinorCurrency(57_150_000, 'VND')}.`,
    }));
    expect(document.body.querySelector('[data-testid="withdrawal-receipt"]')).toBeNull();
  });

  it('falls back to the paid amount until the provider reports the received amount', async () => {
    mutateAsync.mockResolvedValueOnce({
      payout: buildPayout({
        amount_minor: 2_500,
        source_currency: 'USD',
        target_currency: 'VND',
        fx_rate: '25400.0000000000',
        provider_fx_rate: null,
        target_amount_minor: null,
      }),
    });

    await render();
    await setAmount('25');
    await submit();

    const paid = formatMinorCurrency(2_500, 'USD');
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: `Withdrawal requested — ${paid} → ${paid}.`,
    }));
    expect(document.body.querySelector('[data-testid="withdrawal-receipt"]')).toBeNull();
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
    expect(modalClose).not.toHaveBeenCalled();
    expect(toastAdd).not.toHaveBeenCalled();
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
