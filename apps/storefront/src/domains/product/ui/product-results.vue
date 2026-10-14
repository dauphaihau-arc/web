<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import ProductCard from '~/domains/product/ui/product-card.vue'
import type { GetProductsResponseItem } from '~/domains/product/api/contracts/product.contract'

const page = defineModel<number>('page', { required: true })

const props = defineProps<{
  items?: GetProductsResponseItem[]
  total?: number
  limit: number
  loading: boolean
  error?: unknown
  hasActiveFilters?: boolean
}>()
</script>

<template>
  <div class="w-full">
    <div
      v-if="loading"
      class="mb-16 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4"
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

    <Empty
      v-else-if="error"
      variant="naked"
      size="2xl"
      class="mb-16 min-h-[320px]"
      heading-class="font-semibold"
      :icon="ICON_NAME_BY_ALIAS['warning']"
      title="Couldn't load products"
      description="Something went wrong while loading this listing. Please try again."
    />

    <template v-else>
      <div
        v-if="items?.length"
        class="mb-16 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-8"
      >
        <div
          v-for="product of items"
          :key="product.id"
        >
          <ProductCard :product="product" />
        </div>
      </div>

      <template v-else>
        <slot name="empty">
          <Empty
            variant="naked"
            size="2xl"
            class="mb-16 min-h-[320px]"
            heading-class="font-semibold"
            :icon="ICON_NAME_BY_ALIAS[props.hasActiveFilters ? 'search' : 'product']"
            :title="props.hasActiveFilters ? 'No results found' : 'No products here yet'"
            :description="props.hasActiveFilters
              ? 'Try adjusting or clearing your filters.'
              : 'Try another category or browse all products.'"
          />
        </slot>
      </template>

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
