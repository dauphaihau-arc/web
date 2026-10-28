<script setup lang="ts">
import type { Category } from '@arc/models/category'
import AttributeFacets from '~/domains/product/ui/filters/attribute-facets.vue'
import MinMaxPrice from '~/domains/product/ui/filters/min-max-price.vue'
import {
  isDigitalOpts,
  productWhoMadeOpts,
  type PricePresetId,
} from '~/domains/product/ui/filters/product-filter.constants'
import { useProductListingFilters } from '~/domains/product/ui/filters/use-product-listing-filters'
import { useProductFacets } from '~/domains/product/ui/filters/use-product-facets'
import { usePricePresetOptions } from '~/domains/product/ui/filters/use-price-preset-options'

const props = defineProps<{
  categoryId?: Category['id']
  search?: string
  featuredFacetKeys?: string[]
}>()

const { state, isResetDisabled, resetFilters } = useProductListingFilters()
const { currency, pricePresetOpts } = usePricePresetOptions()

// Same request as the facet panel below (shared query key), read here to decide
// whether the section has anything to show at all.
const { facets, isLoading: isFacetsLoading } = useProductFacets({
  scope: () => ({ categoryId: props.categoryId, search: props.search }),
  selections: () => state.attributeFilters,
  featuredFacetKeys: () => props.featuredFacetKeys,
})

// While facets load the skeleton communicates progress, so the section stays
// visible; it disappears only once there is no populated group to render.
const hasAttributeFacets = computed(() => isFacetsLoading.value || facets.value.length > 0)

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
  ...(hasAttributeFacets.value
    ? [{
        id: 'attributes',
        label: 'Attributes',
        defaultOpen: true,
      }]
    : []),
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
          <AppIcon
            :name="open ? 'chevronUp' : 'chevronDown'"
            class="ml-auto text-text-subtle"
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
            :search="props.search"
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
