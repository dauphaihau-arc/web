import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type { VariantEditorSubmission } from '../update-product-form.types';

export type PersistedVariantRow = {
  optionValue1: string
  optionValue2?: string
  optionId1?: string
  optionValueId1?: string
  optionId2?: string
  optionValueId2?: string
  productVariantId?: string
  inventoryId?: string
  amount?: number
  stock?: number
  onHandQuantity?: number
  onHandVersion?: number
  sku?: string
  lifecycleState?: 'active' | 'inactive'
  currency?: string
};

export function rebaseVariantSubmissionOnCurrentProduct(
  submission: VariantEditorSubmission | undefined,
  currentProduct: DetailShopProductResponse['product'] | undefined,
): VariantEditorSubmission | undefined {
  if (!submission || !currentProduct) {
    return submission;
  }

  const currentRows = flattenPersistedVariantRows(currentProduct);
  const currentRowsByVariantId = new Map(
    currentRows
      .filter(row => row.productVariantId)
      .map(row => [row.productVariantId!, row]),
  );
  const currentRowsByInventoryId = new Map(
    currentRows
      .filter(row => row.inventoryId)
      .map(row => [row.inventoryId!, row]),
  );

  return {
    ...submission,
    rows: submission.rows.map((row) => {
      const currentRow = (row.productVariantId ? currentRowsByVariantId.get(row.productVariantId) : undefined) ??
        (row.inventoryId ? currentRowsByInventoryId.get(row.inventoryId) : undefined);

      if (!currentRow) {
        return row;
      }

      return {
        ...row,
        productVariantId: currentRow.productVariantId,
        inventoryId: currentRow.inventoryId,
        optionId1: currentRow.optionId1,
        optionValueId1: currentRow.optionValueId1,
        optionId2: currentRow.optionId2,
        optionValueId2: currentRow.optionValueId2,
        optionValue1: currentRow.optionValue1,
        optionValue2: currentRow.optionValue2 ?? row.optionValue2,
        amount: currentRow.amount ?? row.amount,
        stock: currentRow.onHandQuantity ?? currentRow.stock ?? row.stock,
        onHandVersion: currentRow.onHandVersion,
        lifecycleState: currentRow.lifecycleState,
        sku: currentRow.sku,
        currency: currentRow.currency ?? row.currency,
      };
    }),
  };
}

export function resolvePersistedVariantRow({
  index,
  rows,
  rowsByKey,
  submitted,
}: {
  index: number
  rows: PersistedVariantRow[]
  rowsByKey: Map<string, PersistedVariantRow>
  submitted: VariantEditorSubmission['rows'][number]
}) {
  return (
    submitted.productVariantId
      ? rows.find(row => row.productVariantId === submitted.productVariantId)
      : undefined
  ) ?? rowsByKey.get(variantRowKey(submitted.optionValue1, submitted.optionValue2)) ?? rows[index];
}

export function orderedOptionValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }

  return result;
}

export function variantRowKey(optionValue1: string, optionValue2?: string) {
  return JSON.stringify([optionValue1, optionValue2 ?? null]);
}

export function findPersistedVariantRow(
  product: DetailShopProductResponse['product'],
  submitted: VariantEditorSubmission['rows'][number],
) {
  return flattenPersistedVariantRows(product).find(row =>
    row.optionValue1 === submitted.optionValue1
    && (row.optionValue2 ?? '') === (submitted.optionValue2 ?? ''),
  );
}

export function flattenPersistedVariantRows(
  product: DetailShopProductResponse['product'],
): PersistedVariantRow[] {
  if (product.variant_type === 'none') {
    const defaultVariant = product.variants.find(variant => variant.selections.length === 0);

    return [{
      optionValue1: '',
      productVariantId: defaultVariant?.id,
      inventoryId: product.inventory?.id ?? defaultVariant?.inventory?.id,
      amount: product.inventory?.amount ?? defaultVariant?.inventory?.amount,
      stock: product.inventory?.stock ?? defaultVariant?.inventory?.stock,
      onHandQuantity: product.inventory?.onHandQuantity ?? defaultVariant?.inventory?.onHandQuantity,
      onHandVersion: product.inventory?.onHandVersion ?? defaultVariant?.inventory?.onHandVersion,
      sku: product.inventory?.sku ?? defaultVariant?.inventory?.sku,
      currency: product.inventory?.currency ?? defaultVariant?.inventory?.currency,
    }];
  }

  if (product.variant_type === 'single') {
    const option = product.options[0];

    return product.variants.map((variant) => {
      const selection = variant.selections[0];
      const selectedValue = option?.values.find(value => value.id === selection?.value_id);

      return {
        optionValue1: selectedValue?.value ?? variant.variant_name,
        optionId1: selection?.option_id,
        optionValueId1: selection?.value_id,
        productVariantId: variant.id,
        inventoryId: variant.inventory?.id,
        amount: variant.inventory?.amount,
        stock: variant.inventory?.stock,
        onHandQuantity: variant.inventory?.onHandQuantity,
        onHandVersion: variant.inventory?.onHandVersion,
        sku: variant.inventory?.sku,
        lifecycleState: variant.lifecycle_state,
        currency: variant.inventory?.currency,
      };
    });
  }

  return product.variants.flatMap(variant =>
    (variant.variant_options ?? []).map((optionVariant) => {
      const selections = optionVariant.selections?.length
        ? optionVariant.selections
        : variant.selections;
      const selectionByOptionId = new Map(selections.map(selection => [selection.option_id, selection]));
      const primaryOption = product.options[0];
      const secondaryOption = product.options[1];
      const primarySelection = primaryOption && selectionByOptionId.get(primaryOption.id);
      const secondarySelection = secondaryOption && selectionByOptionId.get(secondaryOption.id);

      return {
        optionValue1: primaryOption?.values.find(value => value.id === primarySelection?.value_id)?.value ?? variant.variant_name,
        optionValue2: secondaryOption?.values.find(value => value.id === secondarySelection?.value_id)?.value ?? optionVariant.variant.variant_name,
        optionId1: primarySelection?.option_id,
        optionValueId1: primarySelection?.value_id,
        optionId2: secondarySelection?.option_id,
        optionValueId2: secondarySelection?.value_id,
        productVariantId: optionVariant.id,
        inventoryId: optionVariant.inventory.id,
        amount: optionVariant.inventory.amount,
        stock: optionVariant.inventory.stock,
        onHandQuantity: optionVariant.inventory.onHandQuantity,
        onHandVersion: optionVariant.inventory.onHandVersion,
        sku: optionVariant.inventory.sku,
        lifecycleState: optionVariant.lifecycle_state,
        currency: optionVariant.inventory.currency,
      };
    }),
  );
}
