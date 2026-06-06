<script lang="ts" setup>
import type { PropType } from 'vue'
import { useRowInteraction } from '~/shared/ui/data-table/use-row-interaction'

type TableRow = { id: string, [key: string]: unknown }
type TableColumn = { key: string, [key: string]: unknown }
type TableEmptyState = { icon: string, label: string }
type TableBy = string | ((row: TableRow) => unknown)

const props = defineProps({
  modelValue: {
    type: Array as PropType<unknown[]>,
    default: () => [],
  },
  rows: {
    type: Array as PropType<TableRow[]>,
    required: true,
  },
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyState: {
    type: Object as PropType<TableEmptyState>,
    required: true,
  },
  by: {
    type: [String, Function] as PropType<TableBy>,
    default: undefined,
  },
  clickableRows: {
    type: Boolean,
    default: false,
  },
  suppressRowClickColumns: {
    type: Array as PropType<string[]>,
    default: () => ['actions'],
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown[]]
  'row-click': [row: TableRow]
}>()

const slots = useSlots()

const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const tableModelValue = computed({
  get: (): unknown[] | undefined => (props.rows.length > 0 ? selected.value : undefined),
  set: (value) => {
    if (value) {
      selected.value = value
    }
  },
})

const rowsRef = computed(() => props.rows)
const clickableRowsRef = toRef(props, 'clickableRows')

const { tableWrapper } = useRowInteraction<TableRow>({
  rows: rowsRef,
  enabled: clickableRowsRef,
  onRowClick: row => emit('row-click', row),
})

const dataSlotColumns = computed(() =>
  props.columns.filter(column => !!slots[`${column.key}-data`]),
)

const tableUi = {
  divide: 'divide-y divide-border-subtle',
  tbody: 'divide-y divide-border-subtle',
} as const
</script>

<template>
  <div
    ref="tableWrapper"
    class="relative"
  >
    <UTable
      v-model="tableModelValue"
      :by="by"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :empty-state="emptyState"
      :ui="tableUi"
    >
      <template
        v-for="column in dataSlotColumns"
        :key="column.key"
        #[`${column.key}-data`]="slotProps"
      >
        <div
          v-if="suppressRowClickColumns.includes(column.key)"
          data-table-action-cell
          class="flex justify-end"
        >
          <slot
            :name="`${column.key}-data`"
            v-bind="slotProps"
          />
        </div>
        <slot
          v-else
          :name="`${column.key}-data`"
          v-bind="slotProps"
        />
      </template>

      <template
        v-if="$slots['loading-state']"
        #loading-state
      >
        <slot name="loading-state" />
      </template>

      <template
        v-if="$slots['empty-state']"
        #empty-state
      >
        <slot name="empty-state" />
      </template>
    </UTable>
  </div>
</template>

<style scoped>
:deep(tbody tr.data-table-row-clickable) {
  cursor: pointer;
}

:deep(tbody tr.data-table-row-clickable > td) {
  transition: background-color 150ms ease;
}

:deep(tbody tr.data-table-row-clickable:hover > td) {
  background-color: var(--surface-muted);
}

:deep(tbody tr.data-table-row-clickable:focus-visible) {
  outline: 2px solid var(--border-hover);
  outline-offset: -2px;
}

:deep(tbody tr [data-row-hover-action]) {
  opacity: 0;
}

:deep(tbody tr:hover [data-row-hover-action]),
:deep(tbody tr.data-table-row-clickable:focus-visible [data-row-hover-action]) {
  opacity: 1;
}

:deep(tbody tr:has([aria-expanded="true"]) [data-row-hover-action]),
:deep(tbody tr:has([data-state="open"]) [data-row-hover-action]) {
  opacity: 0;
}
</style>
