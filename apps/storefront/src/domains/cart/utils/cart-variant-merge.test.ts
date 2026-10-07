import { describe, expect, it } from 'vitest';
import { resolveCartVariantMerge } from './cart-variant-merge';
import type { CartProductItem } from '../api/contracts/cart.contract';

function cartItem(input: {
  id: string
  quantity: number
  inventoryId: string
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
      stock: 10,
      selected_options: [
        {
          option_id: 'color', option_name: 'Color', value_id: 'blue', value: 'Blue',
        },
        {
          option_id: 'size', option_name: 'Size', value_id: 's', value: 'S',
        },
      ],
    },
  };
}

const mover = cartItem({ id: 'item-1', quantity: 1, inventoryId: 'inventory-red' });

describe('resolveCartVariantMerge', () => {
  it('keeps the moved quantity when no sibling holds the target variant', () => {
    const state = resolveCartVariantMerge({
      siblingItems: [],
      selfItemId: mover.id,
      targetInventoryId: 'inventory-blue',
      movedQuantity: 1,
      availableStock: 10,
    });

    expect(state).toMatchObject({
      mergeItem: undefined,
      mergedQuantity: 1,
      maxAddableQuantity: 10,
      exceedsStock: false,
      mergeNote: '',
      stockWarning: '',
    });
  });

  it('sums the sibling quantity into the merge and names the line', () => {
    const sibling = cartItem({ id: 'item-2', quantity: 3, inventoryId: 'inventory-blue' });
    const state = resolveCartVariantMerge({
      siblingItems: [sibling],
      selfItemId: mover.id,
      targetInventoryId: 'inventory-blue',
      movedQuantity: 1,
      availableStock: 10,
    });

    expect(state.mergeItem).toBe(sibling);
    expect(state.mergedQuantity).toBe(4);
    expect(state.maxAddableQuantity).toBe(7);
    expect(state.exceedsStock).toBe(false);
    expect(state.mergeNote).toBe('Merges with your other line (Color: Blue, Size: S) — 3 → 4.');
  });

  it('flags the merge that overflows stock and caps what can still be added', () => {
    const sibling = cartItem({ id: 'item-2', quantity: 8, inventoryId: 'inventory-blue' });
    const state = resolveCartVariantMerge({
      siblingItems: [sibling],
      selfItemId: mover.id,
      targetInventoryId: 'inventory-blue',
      movedQuantity: 5,
      availableStock: 10,
    });

    expect(state.mergedQuantity).toBe(13);
    expect(state.maxAddableQuantity).toBe(2);
    expect(state.exceedsStock).toBe(true);
    expect(state.mergeNote).toBe('');
    expect(state.stockWarning)
      .toBe('Only 10 left in stock. Your cart already holds 8, so only 2 more can be added.');
  });

  it('explains a moved line that already exceeds stock without a sibling', () => {
    const state = resolveCartVariantMerge({
      siblingItems: [],
      selfItemId: mover.id,
      targetInventoryId: 'inventory-blue',
      movedQuantity: 5,
      availableStock: 3,
    });

    expect(state.stockWarning).toBe('Only 3 left in stock; this line has 5.');
  });

  it('states when the sibling already holds all stock', () => {
    const sibling = cartItem({ id: 'item-2', quantity: 2, inventoryId: 'inventory-blue' });
    const state = resolveCartVariantMerge({
      siblingItems: [sibling],
      selfItemId: mover.id,
      targetInventoryId: 'inventory-blue',
      movedQuantity: 1,
      availableStock: 2,
    });

    expect(state.maxAddableQuantity).toBe(0);
    expect(state.stockWarning).toBe('Your cart already holds all 2 available.');
  });

  it('ignores the item being moved when looking for a sibling', () => {
    const state = resolveCartVariantMerge({
      siblingItems: [mover],
      selfItemId: mover.id,
      targetInventoryId: 'inventory-red',
      movedQuantity: 1,
      availableStock: 10,
    });

    expect(state.mergeItem).toBeUndefined();
  });
});
