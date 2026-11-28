import { mountSuspended } from '@nuxt/test-utils/runtime';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import ShippingUnavailableAction from './shipping-unavailable-action.vue';

const dialogFixture = vi.hoisted(() => ({
  isOpen: { value: false },
  open: vi.fn(),
  close: vi.fn(),
}));

vi.mock('~/shared/composables/use-market-preferences-dialog', () => ({
  useMarketPreferencesDialog: () => dialogFixture,
}));

describe('ShippingUnavailableAction', () => {
  beforeEach(() => {
    dialogFixture.open.mockClear();
  });

  it('offers a change region action for a destination failure', async () => {
    const wrapper = await mountSuspended(ShippingUnavailableAction, {
      props: { kind: 'destination' },
    });

    const action = wrapper.find('[data-testid="shipping-unavailable-action"]');

    expect(action.text()).toBe('Change region');

    await action.trigger('click');

    expect(dialogFixture.open).toHaveBeenCalledTimes(1);
  });

  it('offers a change currency action for a currency failure', async () => {
    const wrapper = await mountSuspended(ShippingUnavailableAction, {
      props: { kind: 'currency' },
    });

    const action = wrapper.find('[data-testid="shipping-unavailable-action"]');

    expect(action.text()).toBe('Change currency');

    await action.trigger('click');

    expect(dialogFixture.open).toHaveBeenCalledTimes(1);
  });

  it('renders no action for an internal failure without a link target', async () => {
    const wrapper = await mountSuspended(ShippingUnavailableAction, {
      props: { kind: 'unavailable' },
    });

    expect(wrapper.find('[data-testid="shipping-unavailable-action"]').exists()).toBe(false);
  });

  it('renders an internal failure as a product link when given a destination', async () => {
    const wrapper = await mountSuspended(ShippingUnavailableAction, {
      props: {
        kind: 'unavailable',
        internalLabel: 'Contact seller',
        internalTo: '/clay-house/hand-thrown-mug',
      },
    });

    const action = wrapper.find('[data-testid="shipping-unavailable-action"]');

    expect(action.text()).toBe('Contact seller');
    expect(action.attributes('href')).toContain('/clay-house/hand-thrown-mug');
  });
});
