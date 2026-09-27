<script lang="ts" setup>
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import type { ProductRow } from '../products-table.types'

defineProps<{
  row: ProductRow
}>()
</script>

<template>
  <div class="flex max-w-[260px] items-center gap-2">
    <NuxtImg
      v-if="row.imageUrl"
      :src="row.imageUrl"
      :alt="row.title"
      width="50"
      height="50"
      class="size-[50px] shrink-0 rounded object-cover"
      preload
    />
    <div
      v-else
      class="grid size-[50px] shrink-0 place-items-center rounded"
    >
      <AppIcon
        name="i-heroicons-cube-20-solid"
        size="sm"
      />
    </div>
    <div class="truncate">
      {{ row.title }}
    </div>
  </div>
</template>
