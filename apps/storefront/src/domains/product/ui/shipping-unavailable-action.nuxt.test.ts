import { mountSuspended } from '@nuxt/test-utils/runtime';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import ShippingUnavailableAction from './shipping-unavailable-action.vue';

const dialogFixture = vi.hoisted(() => ({
  open: vi.fn(),
}));

vi.mock('~/shared/composables/use-market-preferences-dialog', () => ({
  useMarketPreferencesDialog: () => dialogFixture,
}));

describe('ShippingUnavailableAction', () => {
  beforeEach(() => {
    dialogFixture.open.mockClear();
  });

  it.each([
    ['destination', 'Change region'],
    ['currency', 'Change currency'],
  ] as const)('opens preferences for %s recovery', async (kind, label) => {
    const wrapper = await mountSuspended(ShippingUnavailableAction, {
      props: { kind },
    });

    const action = wrapper.find('[data-testid="shipping-unavailable-action"]');

    expect(action.text()).toBe(label);

    await action.trigger('click');

    expect(dialogFixture.open).toHaveBeenCalledTimes(1);
  });

  it('renders no action for an internal failure', async () => {
    const wrapper = await mountSuspended(ShippingUnavailableAction, {
      props: { kind: 'unavailable' },
    });

    expect(wrapper.find('[data-testid="shipping-unavailable-action"]').exists()).toBe(false);
  });
});
