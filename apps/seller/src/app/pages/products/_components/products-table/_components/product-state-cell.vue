<script lang="ts" setup>
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { productStateLabel, productStateTone } from '~/domains/shop/ui/product/product-state-display'
import type { ProductRow } from '../products-table.types'

const props = defineProps<{
  row: ProductRow
}>()

const tone = computed(() => productStateTone(props.row.state))
const label = computed(() => productStateLabel(props.row.state))
</script>

<template>
  <StatusBadge :color="tone">
    {{ label }}
  </StatusBadge>
</template>
