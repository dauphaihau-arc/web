<script lang="ts" setup>
import ProductImage from '@arc/ui/primitives/product-image.vue'
import type { ProductRow } from '../products-table.types'

defineProps<{
  row: ProductRow
}>()
</script>

<template>
  <div class="flex max-w-[260px] items-center gap-2">
    <ProductImage
      size="sm"
      rounded="md"
      frame-class="shrink-0"
      :src="row.imageUrl"
      :alt="row.title"
    />
    <div class="truncate">
      {{ row.title }}
    </div>
  </div>
</template>
