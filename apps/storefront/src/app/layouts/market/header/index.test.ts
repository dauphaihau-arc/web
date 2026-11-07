import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { nextTick, ref } from 'vue';
import {
  describe, expect, it, vi,
} from 'vitest';
import LayoutMarketHeader from './header.vue';

vi.mock('./cart-mega-menu.vue', () => ({
  // `defineAsyncComponent` only unwraps `.default` from a module namespace
  // marked as an ES module; without this it treats the namespace as the
  // component and probes `__v_isVNode` on it (Vitest 5 throws for that).
  __esModule: true,
  __isTeleport: false,
  __isKeepAlive: false,
  __isSuspense: false,
  name: 'CartMegaMenu',
  default: {
    name: 'CartMegaMenu',
    props: {
      show: {
        type: Boolean,
        required: true,
      },
    },
    template: '<div v-if="show" id="mega-menu-cart">Your cart is empty.</div>',
  },
}));

vi.mock('~/domains/cart/queries/cart.query', () => ({
  useGetCart: () => ({
    data: ref({
      cart: {
        total_quantity: 0,
        recent_items: [],
      },
    }),
  }),
}));

vi.mock('~/domains/me/queries/current-user.query', () => ({
  useGetCurrentUser: () => ({
    data: ref({ user: null }),
    isPending: ref(false),
  }),
}));

describe('market header', () => {
  it('shows the empty cart menu from the cart trigger', async () => {
    const component = await mountSuspended(LayoutMarketHeader);

    await component.find('#cart-btn').trigger('click');
    await nextTick();
    await flushPromises();
    await vi.dynamicImportSettled();
    await nextTick();

    expect(component.find('#mega-menu-cart').exists()).toBeTruthy();
    expect(component.text()).toContain('Your cart is empty.');
  });
});
