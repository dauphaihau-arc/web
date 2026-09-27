const titleColumn = { key: 'title', label: 'Product' };
const stateColumn = { key: 'status', label: 'Status' };
const variantColumns = [
  { key: 'sku', label: 'SKU Variant' },
  { key: 'variant', label: 'Variant' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'Stock' },
];
const actionsColumn = { key: 'actions' };

/**
 * The state column only earns its width when the list mixes states, which is
 * the All tab; a filtered list shows a single state for every row.
 */
export function buildProductsTableColumns({ showStateColumn }: { showStateColumn: boolean }) {
  return [
    titleColumn,
    ...(showStateColumn ? [stateColumn] : []),
    ...variantColumns,
    actionsColumn,
  ];
}

export const productsTableEmptyState = {
  icon: 'i-heroicons-archive-box-20-solid',
  label: 'No products.',
};
