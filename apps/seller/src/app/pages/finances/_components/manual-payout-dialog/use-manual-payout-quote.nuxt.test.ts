import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import {
  defineComponent, h, nextTick, ref,
} from 'vue';
import type { VueWrapper } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import { formatMinorCurrency } from '@arc/utils';
import type {
  GetShopFinancePayoutQuoteRequest,
  ShopFinancePayoutQuote,
} from '~/domains/shop/api/finance/contracts/payout.contract';
import { useManualPayoutQuote } from './use-manual-payout-quote';

type QuoteRequest = {
  amountMinor: number
  resolve: (quote: ShopFinancePayoutQuote) => void
};

const { fetchQuote, quoteRequests } = vi.hoisted(() => {
  const requests: QuoteRequest[] = [];
  const requestQuote = vi.fn((amountMinor: number) => {
    const { promise, resolve } = Promise.withResolvers<ShopFinancePayoutQuote>();
    requests.push({ amountMinor, resolve });
    return promise;
  });

  return { fetchQuote: requestQuote, quoteRequests: requests };
});

vi.mock('~/domains/shop/utils/resolve-my-shop-id', () => ({
  resolveMyShopId: async () => 'shop_1',
}));

vi.mock('~/domains/shop/api/finance/finance.api', () => ({
  shopFinanceApi: {
    getPayoutQuote: (
      _shopId: string,
      query: GetShopFinancePayoutQuoteRequest,
    ) => fetchQuote(query.amount_minor),
  },
}));

function buildQuote(overrides: Partial<ShopFinancePayoutQuote> = {}): ShopFinancePayoutQuote {
  return {
    source_currency: 'USD',
    target_currency: 'VND',
    source_amount_minor: 5_000,
    fx_rate: '25400.0000000000',
    target_amount_minor: 127_000_000,
    estimated: true,
    ...overrides,
  };
}

const amountMinor = ref(5_000);
const canPreview = ref(true);
const sourceCurrency = ref('USD');
const targetCurrency = ref('VND');

const harnessComponent = defineComponent({
  setup() {
    const quote = useManualPayoutQuote({
      amountMinor,
      canPreview,
      sourceCurrency,
      targetCurrency,
    });

    return () => h('div', [
      h('span', { 'data-testid': 'paid' }, quote.quotedPaidLabel.value),
      h('span', { 'data-testid': 'rate' }, quote.quotedRateLabel.value),
      h('span', { 'data-testid': 'received' }, quote.quotedReceivedLabel.value),
      h('span', { 'data-testid': 'panel' }, String(quote.showQuotePanel.value)),
      h('span', { 'data-testid': 'has-quote' }, String(quote.hasQuote.value)),
      h('span', { 'data-testid': 'conversion' }, String(quote.isConversionQuote.value)),
      h('span', { 'data-testid': 'fetching' }, String(quote.isQuoteFetching.value)),
    ]);
  },
});

let wrapper: VueWrapper | undefined;

async function render() {
  wrapper = await mountSuspended(harnessComponent, {
    global: {
      provide: {
        [VUE_QUERY_CLIENT]: new QueryClient({
          defaultOptions: { queries: { retry: false } },
        }),
      },
    },
  });
  await nextTick();

  return wrapper;
}

function text(testId: string) {
  return wrapper?.find(`[data-testid="${testId}"]`).text() ?? '';
}

/** Lets the debounce fire and the query start. */
async function settleDebounce() {
  vi.advanceTimersByTime(300);
  await nextTick();
  await nextTick();
}

describe('manual payout quote', () => {
  beforeEach(() => {
    quoteRequests.length = 0;
    fetchQuote.mockClear();
    amountMinor.value = 5_000;
    canPreview.value = true;
    sourceCurrency.value = 'USD';
    targetCurrency.value = 'VND';
    // Only the debounce timer is faked: mounting needs the real scheduler.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.useRealTimers();
  });

  it('reserves the panel and shows placeholders until the first quote arrives', async () => {
    await render();

    expect(quoteRequests.map(request => request.amountMinor)).toEqual([5_000]);
    expect(text('panel')).toBe('true');
    expect(text('has-quote')).toBe('false');
    expect(text('paid')).toBe('—');
    expect(text('rate')).toBe('—');
    expect(text('received')).toBe('—');
    expect(text('fetching')).toBe('true');

    quoteRequests[0].resolve(buildQuote());
    await flushPromises();

    expect(text('has-quote')).toBe('true');
    expect(text('paid')).toBe(formatMinorCurrency(5_000, 'USD'));
    expect(text('rate')).toBe('1 USD = 25,400 VND');
    expect(text('received')).toBe(formatMinorCurrency(127_000_000, 'VND'));
    expect(text('fetching')).toBe('false');
  });

  it('waits for the debounce before pricing an edited amount', async () => {
    await render();
    quoteRequests[0].resolve(buildQuote());
    await flushPromises();

    amountMinor.value = 2_500;
    await nextTick();

    expect(quoteRequests).toHaveLength(1);
    expect(text('fetching')).toBe('true');

    await settleDebounce();

    expect(quoteRequests.map(request => request.amountMinor)).toEqual([5_000, 2_500]);
  });

  it('keeps the previous figures on screen while the new amount is priced', async () => {
    await render();
    quoteRequests[0].resolve(buildQuote());
    await flushPromises();

    amountMinor.value = 2_500;
    await nextTick();
    await settleDebounce();

    // The previous quote is still rendered: the panel neither empties nor
    // collapses while the server prices the edited amount.
    expect(text('panel')).toBe('true');
    expect(text('has-quote')).toBe('true');
    expect(text('paid')).toBe(formatMinorCurrency(5_000, 'USD'));
    expect(text('received')).toBe(formatMinorCurrency(127_000_000, 'VND'));
    expect(text('fetching')).toBe('true');

    quoteRequests[1].resolve(buildQuote({
      source_amount_minor: 2_500,
      target_amount_minor: 63_500_000,
    }));
    await flushPromises();

    expect(text('paid')).toBe(formatMinorCurrency(2_500, 'USD'));
    expect(text('received')).toBe(formatMinorCurrency(63_500_000, 'VND'));
    expect(text('fetching')).toBe('false');
  });

  it('falls back to placeholders when the entered amount is not usable', async () => {
    await render();
    quoteRequests[0].resolve(buildQuote());
    await flushPromises();

    canPreview.value = false;
    amountMinor.value = 0;
    await nextTick();

    expect(text('panel')).toBe('true');
    expect(text('has-quote')).toBe('false');
    expect(text('paid')).toBe('—');
    expect(text('rate')).toBe('—');
    expect(text('received')).toBe('—');
    expect(text('fetching')).toBe('false');

    await settleDebounce();

    expect(quoteRequests).toHaveLength(1);
    expect(text('panel')).toBe('true');
    expect(text('has-quote')).toBe('false');
  });

  it('neither prices nor shows a panel into the balance currency', async () => {
    targetCurrency.value = 'USD';

    await render();
    await settleDebounce();

    expect(text('panel')).toBe('false');
    expect(text('has-quote')).toBe('false');
    expect(text('fetching')).toBe('false');
    expect(fetchQuote).not.toHaveBeenCalled();
  });

  it('hides the panel again when the payout currency becomes the balance currency', async () => {
    await render();
    quoteRequests[0].resolve(buildQuote());
    await flushPromises();

    expect(text('panel')).toBe('true');

    targetCurrency.value = 'USD';
    await nextTick();
    await settleDebounce();

    expect(text('panel')).toBe('false');
    expect(text('fetching')).toBe('false');
    expect(fetchQuote).toHaveBeenCalledTimes(1);
  });

  it('exposes rate and received labels for a conversion quote', async () => {
    await render();
    quoteRequests[0].resolve(buildQuote({
      fx_rate: '25400.0000000000',
      target_currency: 'VND',
      target_amount_minor: 57_150_000,
    }));
    await flushPromises();

    expect(text('conversion')).toBe('true');
    expect(text('rate')).toBe('1 USD = 25,400 VND');
    expect(text('received')).toBe(formatMinorCurrency(57_150_000, 'VND'));
  });
});
