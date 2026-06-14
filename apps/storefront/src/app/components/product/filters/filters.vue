<script setup lang="ts">
import type { Category } from '@arc/models/category'
import AttributeFacets from '~/app/components/product/filters/attribute-facets.vue'
import MinMaxPrice from '~/app/components/product/filters/min-max-price.vue'
import {
  getPricePresetRanges,
  isDigitalOpts,
  productWhoMadeOpts,
  type PricePresetId,
} from '~/app/components/product/filters/product-filter.constants'
import {
  createDefaultFilterState,
  useProductFilterQuerySync,
} from '~/app/components/product/filters/use-product-filter-query-sync'
import { useProductFilterState } from '~/app/components/product/filters/use-product-filter-state'

const route = useRoute()
const marketStore = useMarketStore()
const props = defineProps<{
  categoryId?: Category['id']
}>()

const currency = computed(() => marketStore.guestPreferences?.currency ?? 'USD')

function formatPriceValue(amountMajor: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Number.isInteger(amountMajor) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(amountMajor) ? 0 : 2,
  }).format(amountMajor)
}

const pricePresetOpts = computed(() => {
  const ranges = getPricePresetRanges(currency.value)

  return [
    { value: 'all', label: 'Any price' },
    ...ranges.map(range => ({
      value: range.value,
      label: range.min !== undefined && range.max !== undefined
        ? `${formatPriceValue(range.min)}-${formatPriceValue(range.max)}`
        : range.max !== undefined
          ? `Under ${formatPriceValue(range.max)}`
          : `Over ${formatPriceValue(range.min ?? 0)}`,
    })),
    { value: 'custom', label: 'Custom' },
  ]
})

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

const { state, isResetDisabled, resetFilters } = useProductFilterState(
  createDefaultFilterState(route.query, currency.value),
)

const currentCategory = computed(() => {
  if (!props.categoryId) {
    return undefined
  }
  return marketStore.categoriesBreadcrumb.find(category => category.id === props.categoryId)
})

useProductFilterQuerySync(state, currency)
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
            class="ml-auto h-5 w-5 text-text-subtle"
          />
        </button>
      </template>

      <template #item="{ item }">
        <div
          v-if="item.id === 'format'"
          class="px-1"
        >
          <RadioGroupInput
            v-model="state.is_digital"
            :options="isDigitalOpts"
          />
        </div>

        <div
          v-else-if="item.id === 'price'"
          class="px-1"
        >
          <MinMaxPrice
            :price="state.price"
            :min-price="state.min_price"
            :max-price="state.max_price"
            :options="pricePresetOpts"
            @update:price="state.price = $event as PricePresetId"
            @update:min-price="state.min_price = $event"
            @update:max-price="state.max_price = $event"
          />
        </div>

        <div
          v-else-if="item.id === 'type'"
          class="px-1"
        >
          <RadioGroupInput
            v-model="state.who_made"
            :options="productWhoMadeOpts"
          />
        </div>

        <div
          v-else-if="item.id === 'attributes'"
          class="px-1"
        >
          <AttributeFacets
            v-model="state.attribute_filters"
            :category-id="props.categoryId"
            :featured-facet-keys="currentCategory?.featuredFacetKeys"
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
