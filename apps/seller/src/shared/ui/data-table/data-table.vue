<script lang="ts" setup>
import type { PropType } from 'vue'
import { useRowFloatingAction } from '~/shared/ui/data-table/use-row-floating-action'

type TableRow = { id: string, [key: string]: unknown }
type TableColumn = { key: string, [key: string]: unknown }
type TableEmptyState = { icon: string, label: string }

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
  floatingActionLabel: {
    type: String,
    default: 'Detail',
  },
  floatingActionLocked: {
    type: Boolean,
    default: false,
  },
  suppressFloatingActionColumns: {
    type: Array as PropType<string[]>,
    default: () => ['actions'],
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: unknown[]]
  'floating-action': [row: TableRow]
}>()

const slots = useSlots()
const floatingActionLockedRef = toRef(props, 'floatingActionLocked')

const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const rowsRef = computed(() => props.rows)

const {
  actionPosition,
  actionVisible,
  activeRow,
  setActiveRow,
  tableWrapper,
} = useRowFloatingAction<TableRow>({
  rows: rowsRef,
  locked: floatingActionLockedRef,
})

const dataSlotColumns = computed(() =>
  props.columns.filter(column => !!slots[`${column.key}-data`]),
)

function triggerFloatingAction(row: TableRow) {
  setActiveRow(row)
  emit('floating-action', row)
}
</script>

<template>
  <div
    ref="tableWrapper"
    class="relative"
  >
    <div
      v-if="actionVisible && activeRow"
      data-table-floating-action
      class="pointer-events-none absolute z-20 transition-transform duration-75"
      :style="{
        top: `${actionPosition.top}px`,
        left: `${actionPosition.left}px`,
        transform: 'translate(-50%, -50%)',
      }"
    >
      <UButton
        color="gray"
        variant="solid"
        size="xs"
        class="pointer-events-auto min-w-[88px] shadow-lg"
        @click="triggerFloatingAction(activeRow)"
      >
        {{ floatingActionLabel }}
      </UButton>
    </div>

    <UTable
      v-model="selected"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :empty-state="emptyState"
    >
      <template
        v-for="column in dataSlotColumns"
        :key="column.key"
        #[`${column.key}-data`]="slotProps"
      >
        <div
          v-if="suppressFloatingActionColumns.includes(column.key)"
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
:deep(tbody tr.data-table-row-hover-target) {
  cursor: default;
}
</style>
