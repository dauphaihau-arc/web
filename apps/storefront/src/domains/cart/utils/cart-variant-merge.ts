import type { CartProductItem } from '../api/contracts/cart.contract';

/**
 * Replacing a cart line's options can land on a variant another line in the
 * same shop already holds. The two lines merge, so the moved quantity and the
 * existing quantity are summed before stock is judged; the copy fields explain
 * the outcome in the picker panel.
 */
export interface CartVariantMergeState {
  mergeItem?: CartProductItem
  mergedQuantity: number
  maxAddableQuantity: number
  exceedsStock: boolean
  mergeNote: string
  stockWarning: string
}

export function resolveCartVariantMerge(input: {
  siblingItems: CartProductItem[]
  selfItemId: string
  targetInventoryId?: string
  movedQuantity: number
  availableStock?: number
}): CartVariantMergeState {
  const mergeItem = input.targetInventoryId === undefined
    ? undefined
    : input.siblingItems.find(item =>
      item.id !== input.selfItemId && item.inventory.id === input.targetInventoryId);

  const availableStock = input.availableStock ?? 0;
  const mergedQuantity = (mergeItem?.quantity ?? 0) + input.movedQuantity;
  const maxAddableQuantity = Math.max(0, availableStock - (mergeItem?.quantity ?? 0));
  const exceedsStock = input.availableStock !== undefined && mergedQuantity > availableStock;

  return {
    mergeItem,
    mergedQuantity,
    maxAddableQuantity,
    exceedsStock,
    mergeNote: mergeItem && !exceedsStock
      ? formatMergeNote({ mergeItem, mergedQuantity })
      : '',
    stockWarning: exceedsStock
      ? formatStockWarning({
        mergeItem,
        availableStock,
        movedQuantity: input.movedQuantity,
        maxAddableQuantity,
      })
      : '',
  };
}

function formatMergeNote(input: {
  mergeItem: CartProductItem
  mergedQuantity: number
}): string {
  const label = input.mergeItem.inventory.selected_options
    .map(option => `${option.option_name}: ${option.value}`)
    .join(', ');

  return `Merges with your other line${label ? ` (${label})` : ''} — ${input.mergeItem.quantity} → ${input.mergedQuantity}.`;
}

function formatStockWarning(input: {
  mergeItem?: CartProductItem
  availableStock: number
  movedQuantity: number
  maxAddableQuantity: number
}): string {
  if (!input.mergeItem) {
    return `Only ${input.availableStock} left in stock; this line has ${input.movedQuantity}.`;
  }

  if (input.maxAddableQuantity === 0) {
    return `Your cart already holds all ${input.availableStock} available.`;
  }

  return `Only ${input.availableStock} left in stock. Your cart already holds ${input.mergeItem.quantity}, so only ${input.maxAddableQuantity} more can be added.`;
}
