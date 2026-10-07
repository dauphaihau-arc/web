import { describe, expect, it } from 'vitest';
import { buildVariantSelectOptions, resolveInventoryBySelection } from './product-options';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

type DetailProduct = Pick<
  GetDetailProductBySlugResponse,
  'options' | 'variants' | 'inventory'
>;

const product: DetailProduct = {
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

describe('resolveInventoryBySelection', () => {
  it('resolves the inventory whose variant matches every selected value', () => {
    expect(resolveInventoryBySelection(product, ['Red', 'S'])?.id)
      .toBe('inventory-red-small');
    expect(resolveInventoryBySelection(product, ['Blue', 'M'])?.id)
      .toBe('inventory-blue-medium');
  });

  it('does not resolve an inventory that only matches the first option', () => {
    expect(resolveInventoryBySelection(product, ['Blue', ''])).toBeUndefined();
  });

  it('returns undefined when no variant carries the combination', () => {
    expect(resolveInventoryBySelection(product, ['Blue', 'S'])).toBeUndefined();
  });
});

describe('buildVariantSelectOptions', () => {
  it('disables a value whose only matching variant is out of stock', () => {
    expect(buildVariantSelectOptions(product, product.options[0], product.options[1], 'M'))
      .toEqual([
        { label: 'Red (Unavailable)', value: 'Red', disabled: true },
        { label: 'Blue', value: 'Blue', disabled: false },
      ]);
  });

  it('keeps every value enabled while the paired option is unselected', () => {
    expect(buildVariantSelectOptions(product, product.options[0], product.options[1], ''))
      .toEqual([
        { label: 'Red', value: 'Red', disabled: false },
        { label: 'Blue', value: 'Blue', disabled: false },
      ]);
  });
});
