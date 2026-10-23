import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { ShopFinanceSettlementCurrency } from '~/domains/shop/api/finance/contracts/settlement-currency.contract';
import GeneralSettingsPage from './index.vue';

const { settlementState } = vi.hoisted(() => ({
  settlementState: { currency: null as ShopFinanceSettlementCurrency | null },
}));

vi.mock('~/domains/shop/queries/my-shop.query', async () => {
  const { computed } = await import('vue');

  return {
    useGetMyShop: () => ({
      data: computed(() => ({ timezone: 'UTC' })),
    }),
  };
});

vi.mock('~/domains/shop/queries/payout-settings.query', async () => {
  const { computed } = await import('vue');

  return {
    useShopFinancePayoutSettings: () => ({
      data: computed(() => ({
        auto_payout_enabled: false,
        auto_payout_day_of_month: 15,
        auto_payout_eligible: true,
        auto_payout_ineligible_reason: null,
        manual_withdrawals_remaining: 1,
      })),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/queries/settlement-currency.query', async () => {
  const { computed } = await import('vue');

  return {
    SHOP_FINANCE_SETTLEMENT_CURRENCY_QUERY_KEY: 'shop-finance-settlement-currency',
    useShopFinanceSettlementCurrency: () => ({
      data: computed(() => settlementState.currency),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/shop/mutations/update-shop-settings.mutation', async () => {
  const { ref } = await import('vue');

  return {
    useUpdateShopSettings: () => ({
      mutateAsync: vi.fn(),
      isPending: ref(false),
    }),
  };
});

function settlement(overrides: Partial<ShopFinanceSettlementCurrency> = {}): ShopFinanceSettlementCurrency {
  return {
    currency: 'USD',
    effective_from: '2026-01-01T00:00:00.000Z',
    previous_currency: null,
    change_interval_days: 90,
    next_change_allowed_at: null,
    auto_payout_enabled: false,
    can_change: true,
    blocked_reason: null,
    available_minor: 0,
    not_yet_available_minor: 0,
    pending_payout: false,
    ...overrides,
  };
}

async function render(value: ShopFinanceSettlementCurrency) {
  settlementState.currency = value;
  const wrapper = await mountSuspended(GeneralSettingsPage);
  await flushPromises();

  return wrapper;
}

describe('general settings page', () => {
  beforeEach(() => {
    settlementState.currency = null;
  });

  it('passes the allowed eligibility through to the shop currency row', async () => {
    const wrapper = await render(settlement());

    const row = wrapper.get('[data-testid="settlement-currency"]');
    expect(row.text()).toBe('USD');
    expect(row.attributes('disabled')).toBeUndefined();
  });

  it('renders the blocked reason and disables the change action', async () => {
    const wrapper = await render(settlement({
      can_change: false,
      blocked_reason: 'balance_not_zero',
      available_minor: 4_200,
    }));

    const reason = wrapper.get('[data-testid="settlement-currency-blocked-reason"]');
    expect(reason.text()).toContain('Your balance must be zero before you can change your shop currency.');
    expect(reason.get('a').attributes('href')).toBe('/finances');

    expect(wrapper.get('[data-testid="settlement-currency"]').attributes('disabled')).toBeDefined();
  });
});
