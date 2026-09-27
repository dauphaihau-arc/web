<script lang="ts" setup>
import { inventoryCellLines } from '../products-table.helpers'
import type { ProductInventoryField, ProductRow } from '../products-table.types'

const props = defineProps<{
  row: ProductRow
  field: ProductInventoryField
}>()

const lines = computed(() => inventoryCellLines(props.row, props.field))
</script>

<template>
  <div>
    <div
      v-for="(line, index) in lines"
      :key="index"
    >
      {{ line }}
    </div>
  </div>
</template>
