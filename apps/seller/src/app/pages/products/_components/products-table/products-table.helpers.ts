import { ProductStates } from '@arc/enums/product';
import { formatMinorCurrency } from '@arc/utils';
import type {
  BulkMutateShopProductsResponse,
} from '~/domains/shop/api/product/contracts/read.contract';
import type {
  ProductInventoryField,
  ProductRow,
  ProductVariantRow,
  PublishFeedback,
} from './products-table.types';

export function isProductActive(row: Pick<ProductRow, 'state'>) {
  return row.state === ProductStates.ACTIVE;
}

export function variantDisplayName(
  variant: ProductVariantRow | undefined,
  options: ProductRow['options'],
) {
  if (!variant) {
    return '-';
  }

  const displayName = (variant.selections ?? [])
    .map((selection) => {
      const option = options?.find(item => item.id === selection.option_id);
      return option?.values.find(value => value.id === selection.value_id)?.value;
    })
    .filter((value): value is string => Boolean(value))
    .join(', ');

  return displayName || variant.name || '-';
}

/** One display line per inventory entry, matching the table's per-variant column layout. */
export function inventoryCellLines(row: ProductRow, field: ProductInventoryField): string[] {
  if (field === 'variant' && !row.hasOptions) {
    return ['None'];
  }

  return row.inventory.map((item) => {
    switch (field) {
      case 'sku':
        return item.sku || '-';
      case 'variant':
        return variantDisplayName(
          row.variants.find(variant => variant.id === item.product_variant_id),
          row.options,
        );
      case 'price':
        return formatMinorCurrency(item.amount_minor, item.currency);
      case 'stock':
        return String(item.stock ?? '');
    }
  });
}

export function buildPublishFeedback(
  result: BulkMutateShopProductsResponse,
  sourceRows: ProductRow[],
): PublishFeedback {
  const rowById: Record<string, ProductRow | undefined> = {};
  for (const row of sourceRows) {
    rowById[row.id] = row;
  }
  const failedProducts = result.failed.map(item => ({
    id: item.id,
    title: rowById[item.id]?.title ?? item.id,
    reason: item.reason,
  }));

  const reasons = failedProducts.reduce((map, item) => {
    map.set(item.reason, (map.get(item.reason) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return {
    title: result.succeeded_ids.length > 0
      ? 'Some products need fixes before publishing'
      : 'Products need fixes before publishing',
    description: result.succeeded_ids.length > 0
      ? `${result.succeeded_ids.length} published, ${result.failed.length} need attention.`
      : `${result.failed.length} product${result.failed.length > 1 ? 's' : ''} couldn’t be published.`,
    reasonSummaries: Array.from(reasons.entries()).map(([reason, count]) =>
      `${count} product${count > 1 ? 's' : ''}: ${reason}`),
    failedProducts,
  };
}
