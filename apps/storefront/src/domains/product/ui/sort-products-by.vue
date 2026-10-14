<script setup lang="ts">
import { PRODUCT_SORT_OPTIONS } from '~/domains/product/ui/filters/product-sort'
import { useCategoryFilters } from '~/domains/product/ui/filters/use-category-filters'

const { sortOrder } = useCategoryFilters()

const selected = computed({
  get: () => PRODUCT_SORT_OPTIONS.find(option => option.id === sortOrder.value) ?? PRODUCT_SORT_OPTIONS[0],
  set: (option: (typeof PRODUCT_SORT_OPTIONS)[number]) => {
    sortOrder.value = option.id
  },
})
</script>

<template>
  <div class="flex items-center gap-2">
    <div>Sort by:</div>
    <USelectMenu
      v-model="selected"
      :options="PRODUCT_SORT_OPTIONS"
      :ui-menu="{
        width: 'w-[10.5rem]',
      }"
    />
  </div>
</template>
