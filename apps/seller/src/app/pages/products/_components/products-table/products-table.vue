<script lang="ts" setup>
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import type { ListShopProductsItem } from '~/domains/shop/api/product/contracts/read.contract'
import FixedPagination from '~/shared/ui/fixed-pagination.vue'
import SelectionActionBar from '~/shared/ui/selection-action-bar.vue'
import ProductInventoryCell from './_components/product-inventory-cell.vue'
import ProductStateCell from './_components/product-state-cell.vue'
import ProductTitleCell from './_components/product-title-cell.vue'
import ProductsTablePublishFeedback from './_components/products-table-publish-feedback.vue'
import ProductsTableRowActions from './_components/products-table-row-actions.vue'
import { buildProductsTableColumns, productsTableEmptyState } from './products-table.constants'
import type { ProductRow } from './products-table.types'
import { useProductsTable } from './use-products-table'

const props = defineProps<{
  products: ListShopProductsItem[]
  loading: boolean
  page: number
  pageCount: number
  total: number
  shopSlug?: string
  showStateColumn?: boolean
}>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

const { products, shopSlug } = toRefs(props)

const columns = computed(() => buildProductsTableColumns({
  showStateColumn: props.showStateColumn === true,
}))

const {
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
} = useProductsTable(products, shopSlug)
</script>

<template>
  <div>
    <ProductsTablePublishFeedback
      v-if="publishFeedback"
      :feedback="publishFeedback"
      @dismiss="dismissPublishFeedback"
      @edit-first-failed="editFirstFailedProduct"
    />

    <SelectionActionBar
      :count="selectedCount"
      @clear="clearSelection"
    >
      <UButton
        v-if="canPublishSelection"
        color="gray"
        variant="soft"
        :loading="isBulkActionPending('publish')"
        :disabled="isBulkMutatingProducts"
        @click="publishSelected"
      >
        Publish
      </UButton>
      <UButton
        v-if="canDeactivateSelection"
        color="gray"
        variant="soft"
        :loading="isBulkActionPending('deactivate')"
        :disabled="isBulkMutatingProducts"
        @click="deactivateSelected"
      >
        Deactivate
      </UButton>
      <UButton
        color="red"
        variant="soft"
        :loading="isBulkActionPending('remove')"
        :disabled="isBulkMutatingProducts"
        @click="removeSelected"
      >
        Delete
      </UButton>
    </SelectionActionBar>

    <DataTable
      v-model="selected"
      by="id"
      :rows="rows"
      :empty-state="productsTableEmptyState"
      :columns="columns"
      :loading="loading"
      clickable-rows
      @row-click="row => editProduct(row as ProductRow)"
    >
      <template #title-data="{ row }">
        <ProductTitleCell :row="row" />
      </template>

      <template #status-data="{ row }">
        <ProductStateCell :row="row" />
      </template>

      <template #sku-data="{ row }">
        <ProductInventoryCell
          :row="row"
          field="sku"
        />
      </template>

      <template #variant-data="{ row }">
        <ProductInventoryCell
          :row="row"
          field="variant"
        />
      </template>

      <template #price-data="{ row }">
        <ProductInventoryCell
          :row="row"
          field="price"
        />
      </template>

      <template #stock-data="{ row }">
        <ProductInventoryCell
          :row="row"
          field="stock"
        />
      </template>

      <template #actions-data="{ row }">
        <ProductsTableRowActions
          :row="row"
          @edit="editProduct"
          @preview="previewProduct"
          @deactivate="deactivateProduct"
          @remove="removeProduct"
        />
      </template>

      <template #loading-state>
        <div class="grid h-[80vh] w-full place-content-center">
          <LoadingSvg :child-class="'!w-12 !h-12'" />
        </div>
      </template>
    </DataTable>

    <FixedPagination
      :page="page"
      :page-count="pageCount"
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
