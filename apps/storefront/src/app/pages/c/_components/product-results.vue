<script setup lang="ts">
import ProductCard from '~/app/components/product/product-card.vue'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'

const page = defineModel<number>('page', { required: true })

defineProps<{
  items?: GetProductsResponseItem[]
  total?: number
  limit: number
  loading: boolean
}>()
</script>

<template>
  <div class="w-full">
    <div
      v-if="loading"
      class="mb-16 grid grid-cols-4 gap-x-3 gap-y-8"
    >
      <div
        v-for="i in limit"
        :key="i"
      >
        <div>
          <USkeleton
            class="w-full"
            style="aspect-ratio: 1 / 1;"
          />
          <div class="mt-3 space-y-3">
            <USkeleton class="h-5 w-[190px]" />
            <USkeleton class="h-5 w-[150px]" />
            <USkeleton class="h-5 w-[120px]" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <div
        v-if="items?.length"
        class="mb-16 grid grid-cols-4 gap-8"
      >
        <div
          v-for="product of items"
          :key="product.id"
        >
          <ProductCard :product="product" />
        </div>
      </div>

      <div
        v-if="total && total > limit"
        class="flex justify-center"
      >
        <UPagination
          v-model="page"
          size="md"
          :page-count="limit"
          :total="total"
          :inactive-button="{ color: 'gray' }"
        />
      </div>
    </template>
  </div>
</template>
