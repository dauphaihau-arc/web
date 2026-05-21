<script setup lang="ts">
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/detail-by-slug'

const { product } = defineProps<{
  product: GetDetailProductBySlugResponse
}>()

const items = [
  {
    id: 'info',
    label: 'Product details',
    defaultOpen: true,
    content: product.description ?? '',
  }, {
    id: 'shipping',
    label: 'Shipping and return policies',
    defaultOpen: true,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.',
  }, {
    id: 'seller',
    label: 'Meet your sellers',
    disabled: true,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.',
  },
]

const processTime = computed(() => {
  if (product?.shipping?.process_time_label) {
    return product.shipping.process_time_label
  }
  return ''
})
</script>

<template>
  <UAccordion
    color="gray"
    variant="ghost"
    size="sm"
    multiple
    :items="items"
    :ui="{
      item: {
        padding: 'pl-3',
      },
    }"
  >
    <template #item="{ item }">
      <div v-if="item.id === 'shipping'">
        <div class="flex gap-2 p-1.5">
          <UIcon name="i-material-symbols:calendar-month-rounded" />
          Ships out within {{ processTime }} business days
        </div>
        <div class="flex gap-2 p-1.5">
          <UIcon name="i-material-symbols:location-on-outline" />
          Ship from {{ product?.shipping?.origin_country }}
        </div>
      </div>
    </template>
  </UAccordion>
</template>
