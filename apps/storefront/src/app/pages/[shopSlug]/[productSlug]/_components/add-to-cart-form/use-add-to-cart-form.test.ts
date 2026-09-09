import { nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { useAddToCartForm } from './use-add-to-cart-form';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

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
});
