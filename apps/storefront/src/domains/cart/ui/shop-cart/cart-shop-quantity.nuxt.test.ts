import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import CartShopQuantity from './cart-shop-quantity.vue';
import type { CartProductItem } from '~/domains/cart/api/cart.shared';
import type { GetCartResponse, UpdateCartRequest } from '~/domains/cart/api/contracts/cart.contract';

const mutationFixture = vi.hoisted(() => ({
  calls: [] as { body: UpdateCartRequest, onSuccess?: (data: GetCartResponse) => void }[],
}));

const queryClientFixture = vi.hoisted(() => ({
  writes: [] as { key: unknown, updater: (old: unknown) => unknown }[],
}));

vi.mock('~/domains/cart/mutations/update-cart.mutation', () => ({
  // Mirrors TanStack: the hook-level onSuccess runs for every response, the
  // per-call one only for the mutation it was passed to.
  useUpdateCart: (options?: { onSuccess?: (data: GetCartResponse) => void }) => ({
    mutate: (body: UpdateCartRequest, callOptions?: { onSuccess?: (data: GetCartResponse) => void }) => {
      mutationFixture.calls.push({
        body,
        onSuccess: (data) => {
          callOptions?.onSuccess?.(data);
          options?.onSuccess?.(data);
        },
      });
    },
  }),
}));

vi.mock('~/domains/cart/stores/cart.store', () => ({
  useCartStore: () => ({
    additionInfoShopCarts: new Map(),
    stateCheckoutCart: { isPendingCreateOrder: false },
  }),
}));

// The cache merge has its own suite; here the response is the observable payload.
vi.mock('~/domains/cart/utils/apply-priced-cart-update', () => ({
  applyPricedCartUpdate: (_oldData: unknown, data: unknown) => data,
}));

mockNuxtImport('useQueryClient', () => () => ({
  setQueryData: (key: unknown, updater: (old: unknown) => unknown) => {
    queryClientFixture.writes.push({ key, updater });
  },
}));

function mountQuantity(quantity: number, stock = 10) {
  const productCart: CartProductItem = {
    id: 'line-1',
    quantity,
    is_selected: true,
    unit_price_minor: 1000,
    product: {
      id: 'product-1',
      slug: 'mug',
      title: 'Mug',
      shop: { slug: 'clay-house' },
    },
    inventory: {
      id: 'inventory-1',
      amount_minor: 1000,
      currency: 'USD',
      stock,
      selected_options: [],
    },
  };

  return {
    wrapper: mount(CartShopQuantity, { props: { productCart, shopId: 'shop-1' } }),
    productCart,
  };
}

beforeEach(() => {
  mutationFixture.calls.length = 0;
  queryClientFixture.writes.length = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('cart shop quantity', () => {
  it('sends one PATCH carrying the final quantity for a burst of clicks', async () => {
    const { wrapper } = mountQuantity(1);
    const plus = wrapper.findAll('button')[1];

    // The burst outlives the old 1000 ms maxWait window so a mid-burst throttle
    // flush would show up as an extra request.
    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(400);
    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(400);
    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(400);
    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(1500);

    expect(mutationFixture.calls).toHaveLength(1);
    expect(mutationFixture.calls[0].body.quantity).toBe(5);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('5');
  });

  it('lets only the newest response update the cached cart', async () => {
    const { wrapper } = mountQuantity(1);
    const plus = wrapper.findAll('button')[1];

    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(500);
    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(500);

    expect(mutationFixture.calls).toHaveLength(2);

    // The newer request answers first; the older one straggles in afterwards.
    mutationFixture.calls[1].onSuccess?.({ cart: { shop_groups: [{ items: [{ quantity: 3 }] }] } } as unknown as GetCartResponse);
    mutationFixture.calls[0].onSuccess?.({ cart: { shop_groups: [{ items: [{ quantity: 2 }] }] } } as unknown as GetCartResponse);

    expect(queryClientFixture.writes).toHaveLength(1);

    const response = queryClientFixture.writes[0].updater(undefined) as GetCartResponse;

    expect(response.cart?.shop_groups[0].items[0].quantity).toBe(3);
  });

  it('keeps an unsent edit when the server echoes an older quantity', async () => {
    const { wrapper, productCart } = mountQuantity(1);
    const plus = wrapper.findAll('button')[1];

    await plus.trigger('click');
    await vi.advanceTimersByTimeAsync(500);
    expect(mutationFixture.calls).toHaveLength(1);

    // Two more clicks sit inside the debounce window when the first response lands.
    await plus.trigger('click');
    await plus.trigger('click');
    await nextTick();

    await wrapper.setProps({ productCart: { ...productCart, quantity: 2 } });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('4');
    expect(mutationFixture.calls).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(500);
    expect(mutationFixture.calls).toHaveLength(2);
    expect(mutationFixture.calls[1].body.quantity).toBe(4);
  });

  it('follows the server quantity when no edit is pending', async () => {
    const { wrapper, productCart } = mountQuantity(1);

    await wrapper.setProps({ productCart: { ...productCart, quantity: 7 } });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('7');

    await vi.advanceTimersByTimeAsync(500);
    expect(mutationFixture.calls).toHaveLength(0);
  });
});
