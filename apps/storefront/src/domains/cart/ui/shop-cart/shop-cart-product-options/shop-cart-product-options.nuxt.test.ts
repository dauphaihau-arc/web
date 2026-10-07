import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import ShopCartProductOptions from './shop-cart-product-options.vue';
import type { CartProductItem } from '~/domains/cart/api/cart.shared';
import type { UpdateCartRequest } from '~/domains/cart/api/contracts/cart.contract';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

const productFixture = vi.hoisted(() => ({ current: undefined as unknown }));
const updateCartFixture = vi.hoisted(() => ({
  calls: [] as UpdateCartRequest[],
}));

// vi.mock factories are hoisted above imports, so vue must load dynamically.
vi.mock('~/domains/product/queries/detail-by-slug.query', async () => {
  const { computed } = await import('vue');

  return {
    useGetDetailProductBySlug: () => ({
      data: computed(() => productFixture.current),
      isPending: computed(() => false),
      isError: computed(() => false),
    }),
  };
});

vi.mock('~/domains/cart/mutations/update-cart.mutation', async () => {
  const { ref: createRef } = await import('vue');

  return {
    useUpdateCart: () => ({
      mutateAsync: async (body: UpdateCartRequest) => {
        updateCartFixture.calls.push(body);

        return {
          cart: null,
          summary: {
            currency: 'USD',
            subtotal_minor: 0,
            discount_minor: 0,
            subtotal_after_discount_minor: 0,
            shipping_minor: 0,
            total_minor: 0,
            total_selected_quantity: 0,
            total_quantity: 0,
          },
        };
      },
      isPending: createRef(false),
    }),
  };
});

vi.mock('~/domains/cart/stores/cart.store', () => ({
  useCartStore: () => ({ additionInfoShopCarts: new Map() }),
}));

mockNuxtImport('useToast', () => () => ({ add: vi.fn() }));
mockNuxtImport('useQueryClient', () => () => ({ setQueryData: vi.fn() }));

type DetailProduct = Pick<
  GetDetailProductBySlugResponse,
  'options' | 'variants' | 'inventory'
>;

function buildProduct(blueStock = 4): DetailProduct {
  return {
    options: [
      {
        id: 'color',
        name: 'Color',
        position: 1,
        values: [
          { id: 'red', value: 'Red', position: 1 },
          { id: 'blue', value: 'Blue', position: 2 },
        ],
      },
      {
        id: 'size',
        name: 'Size',
        position: 2,
        values: [
          { id: 'small', value: 'S', position: 1 },
          { id: 'medium', value: 'M', position: 2 },
        ],
      },
    ],
    variants: [
      {
        id: 'red-small',
        rank: 1,
        lifecycle_state: 'active',
        selections: [
          { option_id: 'color', value_id: 'red' },
          { option_id: 'size', value_id: 'small' },
        ],
      },
      {
        id: 'blue-small',
        rank: 2,
        lifecycle_state: 'active',
        selections: [
          { option_id: 'color', value_id: 'blue' },
          { option_id: 'size', value_id: 'small' },
        ],
      },
    ],
    inventory: [
      {
        id: 'inventory-red-small', product_variant_id: 'red-small', stock: 4, amount_minor: 1000, currency: 'USD',
      },
      {
        id: 'inventory-blue-small', product_variant_id: 'blue-small', stock: blueStock, amount_minor: 1000, currency: 'USD',
      },
    ],
  };
}

function buildCartItem(input: {
  id: string
  quantity: number
  inventoryId: string
  color: string
  size: string
}): CartProductItem {
  return {
    id: input.id,
    quantity: input.quantity,
    is_selected: true,
    unit_price_minor: 1000,
    product: {
      id: 'product-1',
      slug: 'mug',
      title: 'Mug',
      shop: { slug: 'clay-house' },
    },
    inventory: {
      id: input.inventoryId,
      amount_minor: 1000,
      currency: 'USD',
      stock: 4,
      selected_options: [
        {
          option_id: 'color', option_name: 'Color', value_id: input.color.toLowerCase(), value: input.color,
        },
        {
          option_id: 'size', option_name: 'Size', value_id: input.size.toLowerCase(), value: input.size,
        },
      ],
    },
  };
}

function buildProductCart(quantity = 1) {
  return buildCartItem({
    id: 'cart-item-1',
    quantity,
    inventoryId: 'inventory-red-small',
    color: 'Red',
    size: 'S',
  });
}

function buildSibling(quantity: number) {
  return buildCartItem({
    id: 'cart-item-2',
    quantity,
    inventoryId: 'inventory-blue-small',
    color: 'Blue',
    size: 'S',
  });
}

async function openPopover(input: { quantity?: number, siblings?: CartProductItem[] } = {}) {
  const wrapper = mount(ShopCartProductOptions, {
    props: {
      productCart: buildProductCart(input.quantity),
      siblingItems: input.siblings ?? [],
    },
  });

  await wrapper.find('button').trigger('click');
  await flushPromises();

  return wrapper;
}

function buttonWithText(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find(button => button.text().includes(text));
}

/** Drives a Nuxt UI select by opening it and picking the option by its label. */
async function chooseOption(wrapper: VueWrapper, currentLabel: string, nextLabel: string) {
  const trigger = wrapper
    .findAll('button')
    .find(button => button.text().trim() === currentLabel);

  expect(trigger, `trigger for "${currentLabel}"`).toBeDefined();
  await trigger!.trigger('click');
  await flushPromises();

  const option = wrapper
    .findAll('[role="option"]')
    .find(node => node.text().includes(nextLabel));

  expect(option, `option "${nextLabel}"`).toBeDefined();
  await option!.trigger('click');
  await flushPromises();
}

beforeEach(() => {
  productFixture.current = buildProduct();
  updateCartFixture.calls = [];
});

describe('shop cart product options popover', () => {
  it('shows the current selection on the trigger', () => {
    const wrapper = mount(ShopCartProductOptions, {
      props: { productCart: buildProductCart() },
    });

    expect(wrapper.find('button').text()).toContain('Color: Red, Size: S');
  });

  it('keeps Apply disabled until a different in-stock option is chosen', async () => {
    const wrapper = await openPopover();

    expect(buttonWithText(wrapper, 'Apply')?.attributes('disabled')).toBeDefined();
  });

  it('does not clip the option listbox rendered inside the panel', async () => {
    const wrapper = await openPopover();

    expect(wrapper.find('.overflow-hidden').exists()).toBe(false);
  });

  it('replaces the cart item with the inventory matching the new selection', async () => {
    const wrapper = await openPopover();

    await chooseOption(wrapper, 'Red', 'Blue');

    const apply = buttonWithText(wrapper, 'Apply');
    expect(apply?.attributes('disabled')).toBeUndefined();

    await apply!.trigger('click');
    await flushPromises();

    expect(updateCartFixture.calls).toEqual([
      {
        inventory_id: 'inventory-red-small',
        replace_with_inventory_id: 'inventory-blue-small',
        quantity: 1,
      },
    ]);
  });

  it('warns that the change merges into an existing line', async () => {
    const wrapper = await openPopover({ siblings: [buildSibling(2)] });

    await chooseOption(wrapper, 'Red', 'Blue');

    expect(wrapper.text()).toContain('Merges with your other line');
    expect(wrapper.text()).toContain('2 → 3');
    expect(buttonWithText(wrapper, 'Apply')?.attributes('disabled')).toBeUndefined();
  });

  it('blocks a merge that overflows stock and offers a reduced quantity', async () => {
    productFixture.current = buildProduct(3);
    const wrapper = await openPopover({ quantity: 2, siblings: [buildSibling(2)] });

    await chooseOption(wrapper, 'Red', 'Blue');

    expect(buttonWithText(wrapper, 'Apply')?.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('only 1 more can be added');

    const reduced = buttonWithText(wrapper, 'Add 1 instead');
    expect(reduced).toBeDefined();

    await reduced!.trigger('click');
    await flushPromises();

    expect(updateCartFixture.calls).toEqual([
      {
        inventory_id: 'inventory-red-small',
        replace_with_inventory_id: 'inventory-blue-small',
        quantity: 1,
      },
    ]);
  });
});
