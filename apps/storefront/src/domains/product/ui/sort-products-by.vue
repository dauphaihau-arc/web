<script setup lang="ts">
import { PRODUCT_SORT_OPTIONS, type ProductSortOption } from '~/domains/product/ui/filters/product-sort'
import { useProductListingFilters } from '~/domains/product/ui/filters/use-product-listing-filters'

const { t } = useI18n()
const { sortOrder } = useProductListingFilters()

const sortOptions = computed(() => PRODUCT_SORT_OPTIONS.map(option => ({
  ...option,
  label: t(option.labelKey),
})))

const selected = computed({
  get: () => sortOptions.value.find(option => option.id === sortOrder.value) ?? sortOptions.value[0],
  set: (option: ProductSortOption) => {
    sortOrder.value = option.id
  },
})
</script>

<template>
  <div class="flex items-center gap-2">
    <div>{{ $t('catalog.sort.label') }}</div>
    <USelectMenu
      v-model="selected"
      :options="sortOptions"
      :ui-menu="{
        width: 'w-[10.5rem]',
      }"
    />
  </div>
</template>
