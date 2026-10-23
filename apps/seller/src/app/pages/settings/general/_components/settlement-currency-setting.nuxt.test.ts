import {
  afterEach, describe, expect, it,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { VueWrapper } from '@vue/test-utils';
import type { ShopFinanceSettlementCurrency } from '~/domains/shop/api/finance/contracts/settlement-currency.contract';
import SettlementCurrencySetting from './settlement-currency-setting.vue';

function settings(overrides: Partial<ShopFinanceSettlementCurrency> = {}): ShopFinanceSettlementCurrency {
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

let wrapper: VueWrapper | undefined;

async function render(value: ShopFinanceSettlementCurrency) {
  wrapper = await mountSuspended(SettlementCurrencySetting, {
    props: { settings: value },
  });

  return wrapper;
}

function currencyButton(mounted: VueWrapper) {
  return mounted.get('[data-testid="settlement-currency"]');
}

describe('settlement currency setting', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it('shows the currency the shop settles in', async () => {
    const mounted = await render(settings());

    const trigger = mounted.get('[data-testid="settlement-currency"]');
    expect(trigger.text()).toBe('USD');
    expect(trigger.attributes('aria-label')).toBe('Change shop currency');
    expect(currencyButton(mounted).attributes('disabled')).toBeUndefined();
  });

  it('shows a changed currency and offers the change action', async () => {
    const mounted = await render(settings({
      currency: 'EUR',
      previous_currency: 'USD',
      next_change_allowed_at: '2027-01-20T09:30:00.000Z',
    }));

    expect(mounted.get('[data-testid="settlement-currency"]').text()).toBe('EUR');
    expect(currencyButton(mounted).attributes('disabled')).toBeUndefined();
    expect(mounted.get('[data-testid="settlement-currency-next-change"]').text())
      .toBe('Next change: Jan 20, 2027');
  });

  it('disables the action and points at the balance when it is not zero', async () => {
    const mounted = await render(settings({
      can_change: false,
      blocked_reason: 'balance_not_zero',
      available_minor: 12_500,
      not_yet_available_minor: 300,
    }));

    const reason = mounted.get('[data-testid="settlement-currency-blocked-reason"]');
    expect(currencyButton(mounted).attributes('disabled')).toBeDefined();
    expect(reason.text()).toContain('Your balance must be zero before you can change your shop currency.');

    const link = reason.get('a');
    expect(link.text()).toBe('View balance');
    expect(link.attributes('href')).toBe('/finances');
  });

  it('disables the action and points at payouts while one is pending', async () => {
    const mounted = await render(settings({
      can_change: false,
      blocked_reason: 'payout_pending',
      pending_payout: true,
    }));

    const reason = mounted.get('[data-testid="settlement-currency-blocked-reason"]');
    expect(currencyButton(mounted).attributes('disabled')).toBeDefined();
    expect(reason.text()).toContain('A payout is still pending. Wait for it to finish, then change your shop currency.');

    const link = reason.get('a');
    expect(link.text()).toBe('View payouts');
    expect(link.attributes('href')).toBe('/finances/payouts');
  });

  it('disables the action and shows the date when a change is too soon', async () => {
    const mounted = await render(settings({
      can_change: false,
      blocked_reason: 'change_too_soon',
      next_change_allowed_at: '2027-01-20T09:30:00.000Z',
    }));

    const reason = mounted.get('[data-testid="settlement-currency-blocked-reason"]');
    expect(currencyButton(mounted).attributes('disabled')).toBeDefined();
    expect(reason.text()).toBe('Next change: Jan 20, 2027');
    expect(reason.find('a').exists()).toBe(false);
  });
});
