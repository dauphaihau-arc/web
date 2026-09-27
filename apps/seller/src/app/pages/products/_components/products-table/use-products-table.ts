import type { Ref } from 'vue';
import type {
  BulkMutateShopProductsAction,
  ListShopProductsItem,
} from '~/domains/shop/api/product/contracts/read.contract';
import { useShopBulkMutateProducts } from '~/domains/shop/mutations/bulk-mutate-products.mutation';
import { routes } from '~/shared/navigation/routes';
import { buildPublishFeedback, isProductActive } from './products-table.helpers';
import { toProductRows } from './products-table.mapper';
import type { ProductRow, PublishFeedback } from './products-table.types';

/**
 * Owns products-table state: row selection, bulk mutation feedback, and row
 * navigation. The table component stays a composition surface.
 */
export function useProductsTable(
  products: Ref<ListShopProductsItem[]>,
  shopSlug: Ref<string | undefined>,
) {
  const config = useRuntimeConfig();
  const storefrontAppURL = computed(() => config.public.storefrontAppURL.replace(/\/+$/, ''));

  const selected = ref<ProductRow[]>([]);
  const publishFeedback = ref<PublishFeedback | null>(null);

  const {
    mutateAsync: bulkMutateProducts,
  } = useShopBulkMutateProducts();

  /**
   * Actions currently in flight. Tracking them by action lets each bulk button
   * show its own loading state while the rest stay disabled.
   */
  const pendingBulkActions = ref<Set<BulkMutateShopProductsAction>>(new Set());
  const isBulkMutatingProducts = computed(() => pendingBulkActions.value.size > 0);

  function isBulkActionPending(action: BulkMutateShopProductsAction) {
    return pendingBulkActions.value.has(action);
  }

  const rows = computed(() => toProductRows(products.value));
  const selectedIds = computed(() => selected.value.map(row => row.id));
  const selectedCount = computed(() => selectedIds.value.length);

  /**
   * A bulk action only applies to a single-state selection: publishing an
   * active product (or deactivating a draft) is not a real transition, so a
   * mixed selection offers neither.
   */
  const hasActiveSelection = computed(() => selected.value.some(isProductActive));
  const hasInactiveSelection = computed(() => selected.value.some(row => !isProductActive(row)));
  const canPublishSelection = computed(() => selectedCount.value > 0 && !hasActiveSelection.value);
  const canDeactivateSelection = computed(() => selectedCount.value > 0 && !hasInactiveSelection.value);

  watch(products, () => {
    selected.value = [];
    publishFeedback.value = null;
  });

  async function runBulkMutation(
    action: BulkMutateShopProductsAction,
    ids = selectedIds.value,
    sourceRows = selected.value.filter(row => ids.includes(row.id)),
  ) {
    if (!ids.length) {
      return;
    }

    publishFeedback.value = null;
    pendingBulkActions.value.add(action);

    try {
      const result = await bulkMutateProducts({
        ids,
        action,
      });

      const failedIds = new Set(result.failed.map(item => item.id));
      selected.value = sourceRows.filter(row => failedIds.has(row.id));

      if (action === 'publish' && result.failed.length > 0) {
        publishFeedback.value = buildPublishFeedback(result, sourceRows);
      }
    }
    finally {
      pendingBulkActions.value.delete(action);
    }
  }

  function clearSelection() {
    selected.value = [];
  }

  function dismissPublishFeedback() {
    publishFeedback.value = null;
  }

  function publishSelected() {
    return runBulkMutation('publish');
  }

  function deactivateSelected() {
    return runBulkMutation('deactivate');
  }

  function removeSelected() {
    return runBulkMutation('remove');
  }

  function deactivateProduct(row: ProductRow) {
    return runBulkMutation('deactivate', [row.id]);
  }

  function removeProduct(row: ProductRow) {
    return runBulkMutation('remove', [row.id]);
  }

  function editProduct(row: ProductRow) {
    return navigateTo(routes.productDetail(row.id));
  }

  function previewProduct(row: ProductRow) {
    const slug = shopSlug.value;
    if (!slug) {
      return;
    }

    return navigateTo(
      `${storefrontAppURL.value}/${slug}/${row.slug}`,
      {
        external: true,
        open: { target: '_blank' },
      },
    );
  }

  function editFirstFailedProduct() {
    const failedProductId = publishFeedback.value?.failedProducts[0]?.id;
    if (!failedProductId) {
      return;
    }

    return navigateTo(routes.productDetail(failedProductId));
  }

  return {
    rows,
    selected,
    selectedCount,
    canPublishSelection,
    canDeactivateSelection,
    publishFeedback,
    isBulkMutatingProducts,
    isBulkActionPending,
    clearSelection,
    dismissPublishFeedback,
    publishSelected,
    deactivateSelected,
    removeSelected,
    deactivateProduct,
    removeProduct,
    editProduct,
    previewProduct,
    editFirstFailedProduct,
  };
}
