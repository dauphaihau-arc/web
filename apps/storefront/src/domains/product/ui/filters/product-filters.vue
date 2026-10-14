<script setup lang="ts">
import type { Category } from '@arc/models/category'
import AttributeFacets from '~/domains/product/ui/filters/attribute-facets.vue'
import MinMaxPrice from '~/domains/product/ui/filters/min-max-price.vue'
import {
  isDigitalOpts,
  productWhoMadeOpts,
  type PricePresetId,
} from '~/domains/product/ui/filters/product-filter.constants'
import { useCategoryFilters } from '~/domains/product/ui/filters/use-category-filters'
import { usePricePresetOptions } from '~/domains/product/ui/filters/use-price-preset-options'

const props = defineProps<{
  categoryId?: Category['id']
  featuredFacetKeys?: string[]
}>()

const { state, isResetDisabled, resetFilters } = useCategoryFilters()
const { currency, pricePresetOpts } = usePricePresetOptions()

const filterItems = computed(() => [
  {
    id: 'format',
    label: 'Item format',
    defaultOpen: true,
  },
  {
    id: 'price',
    label: `Price (${currency.value})`,
    defaultOpen: true,
  },
  {
    id: 'type',
    label: 'Item type',
    defaultOpen: true,
  },
  {
    id: 'attributes',
    label: 'Attributes',
    defaultOpen: true,
  },
])
</script>

<template>
  <div class="pr-2">
    <UAccordion
      color="gray"
      variant="ghost"
      size="sm"
      multiple
      :items="filterItems"
      :ui="{
        item: {
          padding: 'pl-1 pb-6',
        },
      }"
    >
      <template #default="{ item, open }">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-none bg-transparent py-1 text-left text-base font-semibold text-text-strong transition-colors hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
        >
          <span>{{ item.label }}</span>
          <UIcon
            :name="open ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'"
            class="ml-auto size-5 text-text-subtle"
          />
        </button>
      </template>

      <template #item="{ item }">
        <div
          v-if="item.id === 'format'"
          class="px-1"
        >
          <RadioGroupInput
            v-model="state.isDigital"
            :options="isDigitalOpts"
          />
        </div>

        <div
          v-else-if="item.id === 'price'"
          class="px-1"
        >
          <MinMaxPrice
            :price="state.price"
            :min-price="state.minPrice"
            :max-price="state.maxPrice"
            :options="pricePresetOpts"
            @update:price="state.price = $event as PricePresetId"
            @update:min-price="state.minPrice = $event"
            @update:max-price="state.maxPrice = $event"
          />
        </div>

        <div
          v-else-if="item.id === 'type'"
          class="px-1"
        >
          <RadioGroupInput
            v-model="state.whoMade"
            :options="productWhoMadeOpts"
          />
        </div>

        <div
          v-else-if="item.id === 'attributes'"
          class="px-1"
        >
          <AttributeFacets
            v-model="state.attributeFilters"
            :category-id="props.categoryId"
            :featured-facet-keys="props.featuredFacetKeys"
          />
        </div>
      </template>
    </UAccordion>

    <UButton
      block
      class="mt-1"
      :disabled="isResetDisabled"
      @click="resetFilters"
    >
      Reset filters
    </UButton>
  </div>
</template>
