<script lang="ts" setup>
import type { ProductImportPreviewRow } from '../../product-import-preview'
import DataTable from '~/shared/ui/data-table/data-table.vue'

type PreviewTableRow = ProductImportPreviewRow & { id: string }

const props = defineProps<{
  rows: ProductImportPreviewRow[]
}>()

const columns = [
  { key: 'row', label: 'Row', class: 'text-center' },
  { key: 'title', label: 'Title' },
  { key: 'sku', label: 'SKU' },
  { key: 'categoryPath', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'status', label: 'Status' },
]

const rows = computed<PreviewTableRow[]>(() =>
  props.rows.map(row => ({
    ...row,
    id: String(row.row),
  })),
)

function hasIssue(row: ProductImportPreviewRow, field: ProductImportPreviewRow['issues'][number]['field']) {
  return row.issues.some(issue => issue.field === field)
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-border-subtle bg-surface">
    <div class="flex items-center justify-between px-4 py-3">
      <div>
        <h2 class="text-sm font-semibold text-text-strong">
          Preview
        </h2>
        <p class="text-xs text-text-muted">
          First {{ rows.length }} rows
        </p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <DataTable
        by="id"
        :rows="rows"
        :columns="columns"
        :selectable="false"
        :empty-state="{ icon: 'i-heroicons-archive-box-20-solid', label: 'No rows to preview.' }"
      >
        <template #row-data="{ row }">
          <div class="text-center">
            {{ row.row }}
          </div>
        </template>

        <template #title-data="{ row }">
          <span
            class="font-medium"
            :class="hasIssue(row, 'title') ? 'text-red-600' : 'text-text-strong'"
          >
            {{ row.title || '-' }}
          </span>
        </template>

        <template #sku-data="{ row }">
          {{ row.sku || '-' }}
        </template>

        <template #categoryPath-data="{ row }">
          <span :class="hasIssue(row, 'categoryPath') ? 'text-red-600' : undefined">
            {{ row.categoryPath || '-' }}
          </span>
        </template>

        <template #price-data="{ row }">
          <span :class="hasIssue(row, 'price') ? 'text-red-600' : undefined">
            {{ row.price || '-' }}
          </span>
        </template>

        <template #stock-data="{ row }">
          <span :class="hasIssue(row, 'stock') ? 'text-red-600' : undefined">
            {{ row.stock || '-' }}
          </span>
        </template>

        <template #status-data="{ row }">
          <UBadge
            v-if="row.issues.length === 0"
            color="green"
            variant="soft"
          >
            Ready
          </UBadge>

          <div
            v-else
            class="max-w-64 space-y-1 text-xs text-red-600"
          >
            <p
              v-for="issue in row.issues"
              :key="`${issue.field}:${issue.message}`"
            >
              {{ issue.message }}
            </p>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
