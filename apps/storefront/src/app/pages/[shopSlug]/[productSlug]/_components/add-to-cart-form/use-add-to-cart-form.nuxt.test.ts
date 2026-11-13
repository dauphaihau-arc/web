import { nextTick, ref } from 'vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { useAddToCartForm } from './use-add-to-cart-form';
import type { AddProductToCartRequest } from '~/domains/cart/api/contracts/cart.contract';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

const addToCartFixture = vi.hoisted(() => ({
  calls: [] as AddProductToCartRequest[],
  response: undefined as unknown,
}));
const navigateToFixture = vi.hoisted(() => vi.fn());

// vi.mock factories are hoisted above imports, so vue must load dynamically.
vi.mock('~/domains/cart/mutations/add-product.mutation', async () => {
  const { ref: createRef } = await import('vue');

  return {
    useAddProductToCart: () => ({
      mutateAsync: async (body: AddProductToCartRequest) => {
        addToCartFixture.calls.push(body);

        return addToCartFixture.response;
      },
      isPending: createRef(false),
    }),
  };
});

mockNuxtImport('useToast', () => () => ({ add: vi.fn() }));
mockNuxtImport('useQueryClient', () => () => ({ setQueryData: vi.fn() }));
mockNuxtImport('navigateTo', () => navigateToFixture);

const EMPTY_SUMMARY = {
  currency: 'USD',
  subtotal_minor: 0,
  discount_minor: 0,
  subtotal_after_discount_minor: 0,
  shipping_minor: 0,
  total_minor: 0,
  total_selected_quantity: 0,
  total_quantity: 0,
};

type AddToCartProduct = Pick<
  GetDetailProductBySlugResponse,
  'inventory' | 'options' | 'variants'
>;

const product: AddToCartProduct = {
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
      id: 'red-medium',
      rank: 2,
      lifecycle_state: 'active',
      selections: [
        { option_id: 'color', value_id: 'red' },
        { option_id: 'size', value_id: 'medium' },
      ],
    },
    {
      id: 'blue-medium',
      rank: 3,
      lifecycle_state: 'active',
      selections: [
        { option_id: 'color', value_id: 'blue' },
        { option_id: 'size', value_id: 'medium' },
      ],
    },
  ],
  inventory: [
    {
      id: 'inventory-red-small',
      product_variant_id: 'red-small',
      stock: 2,
      amount_minor: 1000,
      currency: 'USD',
    },
    {
      id: 'inventory-red-medium',
      product_variant_id: 'red-medium',
      stock: 0,
      amount_minor: 1000,
      currency: 'USD',
    },
    {
      id: 'inventory-blue-medium',
      product_variant_id: 'blue-medium',
      stock: 3,
      amount_minor: 1000,
      currency: 'USD',
    },
  ],
};

describe('useAddToCartForm', () => {
  it('allows either variant option to be selected first and disables unavailable values', async () => {
    const inventorySelectedModel = ref<AddToCartProduct['inventory'][number]>();
    const form = useAddToCartForm({
      product: ref(product),
      inventorySelectedModel,
    });

    expect(form.subVariantOptions.value).toEqual([
      { label: 'S', value: 'S', disabled: false },
      { label: 'M', value: 'M', disabled: false },
    ]);

    form.stateSubmit.variantSubOption = 'M';

    expect(form.variantOptions.value).toEqual([
      { label: 'Red (Unavailable)', value: 'Red', disabled: true },
      { label: 'Blue', value: 'Blue', disabled: false },
    ]);

    form.stateSubmit.variantOption = 'Blue';

    await nextTick();
    await nextTick();

    expect(form.resolvedInventorySelected.value?.id).toBe('inventory-blue-medium');
    expect(inventorySelectedModel.value?.id).toBe('inventory-blue-medium');
  });

  it('keeps the second option visible when the first option is empty', () => {
    const form = useAddToCartForm({
      product: ref(product),
      inventorySelectedModel: ref(),
    });

    expect(form.subVariantOptions.value.map(option => option.value)).toEqual(['S', 'M']);
  });

  describe('submit', () => {
    beforeEach(() => {
      addToCartFixture.calls = [];
      addToCartFixture.response = { cart: { id: 'cart-1' }, summary: EMPTY_SUMMARY };
      navigateToFixture.mockClear();
    });

    it('posts the resolved inventory and quantity for an add to cart', async () => {
      const form = useAddToCartForm({
        product: ref(product),
        inventorySelectedModel: ref(),
      });

      form.stateSubmit.variantOption = 'Red';
      form.stateSubmit.variantSubOption = 'S';
      await nextTick();
      await nextTick();

      await form.submit({ quantity: 2, isBuyNow: false });

      expect(addToCartFixture.calls).toEqual([
        { inventory_id: 'inventory-red-small', quantity: 2 },
      ]);
      expect(navigateToFixture).not.toHaveBeenCalled();
    });

    it('marks the cart as temporary for Buy Now and hands off to checkout', async () => {
      const form = useAddToCartForm({
        product: ref(product),
        inventorySelectedModel: ref(),
      });

      form.stateSubmit.variantOption = 'Blue';
      form.stateSubmit.variantSubOption = 'M';
      await nextTick();
      await nextTick();

      await form.submit({ quantity: 1, isBuyNow: true });

      expect(addToCartFixture.calls).toEqual([
        { inventory_id: 'inventory-blue-medium', quantity: 1, is_temp: true },
      ]);
      expect(navigateToFixture).toHaveBeenCalledTimes(1);
    });

    it('does not post when the selection has no available inventory', async () => {
      const form = useAddToCartForm({
        product: ref(product),
        inventorySelectedModel: ref(),
      });

      await form.submit({ quantity: 1, isBuyNow: false });

      expect(addToCartFixture.calls).toEqual([]);
    });
  });
});
