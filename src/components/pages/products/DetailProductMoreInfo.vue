<script setup lang="ts">
import type { ResponseGetDetailProduct } from '~/types/request-api/product'

const { product } = defineProps<ResponseGetDetailProduct>()

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
  if (product?.shipping?.process_time) {
    return product.shipping.process_time.substring(0, product.shipping.process_time.length - 1)
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
          Ship from {{ product?.shipping?.country }}
        </div>
      </div>
    </template>
  </UAccordion>
</template>
