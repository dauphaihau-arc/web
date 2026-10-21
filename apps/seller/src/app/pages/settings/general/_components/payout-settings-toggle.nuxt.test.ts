import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import type { ShopFinancePayoutSettings } from '~/domains/shop/api/finance/contracts/payout-settings.contract';
import PayoutSettingsToggle from './payout-settings-toggle.vue';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('~/domains/shop/mutations/update-payout-settings.mutation', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { ref } = await import('vue');

  return {
    useUpdateShopFinancePayoutSettings: () => ({
      mutateAsync,
      isPending: ref(false),
    }),
  };
});

function settings(overrides: Partial<ShopFinancePayoutSettings> = {}): ShopFinancePayoutSettings {
  return {
    auto_payout_enabled: false,
    auto_payout_day_of_month: 15,
    auto_payout_eligible: true,
    auto_payout_ineligible_reason: null,
    manual_withdrawals_remaining: 1,
    ...overrides,
  };
}

async function render(value: ShopFinancePayoutSettings) {
  return mountSuspended(PayoutSettingsToggle, {
    props: { settings: value },
  });
}

describe('payout settings toggle', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue(settings({ auto_payout_enabled: true }));
  });

  it('starts switched off when auto payout is off', async () => {
    const wrapper = await render(settings());

    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
  });

  it('turns auto payout on through the API', async () => {
    const wrapper = await render(settings());

    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({ auto_payout_enabled: true });
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true');
  });

  it('turns auto payout off when the stored setting is on', async () => {
    mutateAsync.mockResolvedValue(settings({ auto_payout_enabled: false }));
    const wrapper = await render(settings({ auto_payout_enabled: true }));

    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true');

    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({ auto_payout_enabled: false });
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
  });

  it('returns the switch to the stored setting when saving fails', async () => {
    mutateAsync.mockRejectedValueOnce({ data: { code: 'UNEXPECTED', message: 'Nope' } });
    const wrapper = await render(settings());

    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
  });

  it('disables the off switch and explains why the shop is not eligible', async () => {
    const wrapper = await render(settings({
      auto_payout_eligible: false,
      auto_payout_ineligible_reason: 'no_payout_account',
    }));

    expect(wrapper.get('[role="switch"]').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Add a payout account first.');
  });

  it('lets an ineligible shop turn an enabled auto payout off', async () => {
    mutateAsync.mockResolvedValue(settings({ auto_payout_enabled: false }));
    const wrapper = await render(settings({
      auto_payout_enabled: true,
      auto_payout_eligible: false,
      auto_payout_ineligible_reason: 'payout_account_unverified',
    }));

    expect(wrapper.get('[role="switch"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.text()).not.toContain('Payout account is not verified yet.');

    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({ auto_payout_enabled: false });
  });
});
