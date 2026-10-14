<script setup lang="ts">
import type { FacetOptionView, FacetOptionViewOption } from '~/domains/product/ui/filters/facet-option-view'
import type { ProductSortId } from '~/domains/product/ui/filters/product-sort'
import MinMaxPrice from '~/domains/product/ui/filters/min-max-price.vue'
import { toggleFacetSelection } from '~/domains/product/ui/filters/facet-option-view'
import {
  isDigitalOpts,
  productWhoMadeOpts,
  type PricePresetId,
  type ProductFilterState,
} from '~/domains/product/ui/filters/product-filter.constants'
import { PRODUCT_SORT_OPTIONS } from '~/domains/product/ui/filters/product-sort'
import { cloneFilterState, useCategoryFilters } from '~/domains/product/ui/filters/use-category-filters'
import { createDefaultFilterState } from '~/domains/product/ui/filters/use-product-filter-query-sync'
import { countActiveFilters } from '~/domains/product/ui/filters/use-product-filter-state'
import { usePricePresetOptions } from '~/domains/product/ui/filters/use-price-preset-options'

/** `all` shows every section, `sort` only the sort section, `facet:<key>` one facet. */
const props = defineProps<{
  panel: string | null
  facets: FacetOptionView[]
}>()

const emit = defineEmits<{
  'update:panel': [value: string | null]
}>()

const { state, sortOrder } = useCategoryFilters()
const { currency, pricePresetOpts } = usePricePresetOptions()

// Edits are staged on a draft so the sheet commits exactly one route query on
// Apply instead of pushing on every toggle.
const draft = reactive<ProductFilterState>(cloneFilterState(state))
const draftSort = ref<ProductSortId>(sortOrder.value)

const isOpen = computed({
  get: () => props.panel !== null,
  set: (open: boolean) => {
    if (!open) {
      emit('update:panel', null)
    }
  },
})

const showAll = computed(() => props.panel === 'all')
const showSort = computed(() => showAll.value || props.panel === 'sort')
const activeFacetKey = computed(() => props.panel?.startsWith('facet:')
  ? props.panel.slice('facet:'.length)
  : undefined)

const sheetFacets = computed(() => {
  if (showAll.value) {
    return props.facets
  }

  const facetKey = activeFacetKey.value

  return facetKey ? props.facets.filter(facet => facet.facetKey === facetKey) : []
})

const sheetTitle = computed(() => {
  if (showAll.value) {
    return 'Filter'
  }

  if (showSort.value) {
    return 'Sort By'
  }

  return sheetFacets.value[0]?.attributeName ?? 'Filter'
})

const draftCount = computed(() => countActiveFilters(draft))

const sortRadioOptions = computed(() => PRODUCT_SORT_OPTIONS.map(option => ({
  value: option.id,
  label: option.label,
})))

watch(() => props.panel, (panel) => {
  if (!panel) {
    return
  }

  Object.assign(draft, cloneFilterState(state))
  draftSort.value = sortOrder.value
})

function apply() {
  Object.assign(state, cloneFilterState(draft))
  sortOrder.value = draftSort.value
  emit('update:panel', null)
}

function clearDraft() {
  Object.assign(draft, createDefaultFilterState({}, currency.value))
}

function toggleOption(facet: FacetOptionView, option: FacetOptionViewOption, checked: boolean) {
  draft.attributeFilters = toggleFacetSelection(draft.attributeFilters, {
    facetKey: facet.facetKey,
    attributeName: facet.attributeName,
    optionKey: option.optionKey,
    optionValue: option.value,
    checked,
  })
}

function isOptionSelected(facetKey: string, optionKey: string) {
  return draft.attributeFilters.some(filter =>
    filter.facetKey === facetKey
    && filter.selectedOptionKeys.includes(optionKey),
  )
}
</script>

<template>
  <USlideover
    v-model="isOpen"
    side="bottom"
    :aria-label="sheetTitle"
    :ui="{
      width: 'max-w-none',
      height: 'h-auto max-h-[85dvh]',
      rounded: 'rounded-t-2xl',
    }"
  >
    <div class="flex max-h-[85dvh] flex-col bg-surface">
      <div class="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <span class="text-lg font-semibold">{{ sheetTitle }}</span>
        <UButton
          color="gray"
          variant="ghost"
          square
          size="lg"
          aria-label="Close filters"
          @click="emit('update:panel', null)"
        >
          <AppIcon name="xMarkSolid" />
        </UButton>
      </div>

      <div class="scrollbar-subtle flex-1 overflow-y-auto p-5">
        <section v-if="showSort">
          <h3
            v-if="showAll"
            class="mb-3 text-base font-semibold"
          >
            Sort By
          </h3>
          <RadioGroupInput
            v-model="draftSort"
            :options="sortRadioOptions"
          />
        </section>

        <template v-if="showAll">
          <UDivider class="my-5" />
          <section>
            <h3 class="mb-3 text-base font-semibold">
              Item format
            </h3>
            <RadioGroupInput
              v-model="draft.isDigital"
              :options="isDigitalOpts"
            />
          </section>

          <UDivider class="my-5" />
          <section>
            <h3 class="mb-3 text-base font-semibold">
              Item type
            </h3>
            <RadioGroupInput
              v-model="draft.whoMade"
              :options="productWhoMadeOpts"
            />
          </section>
        </template>

        <template
          v-for="(facet, index) in sheetFacets"
          :key="facet.facetKey"
        >
          <UDivider
            v-if="showAll || index > 0"
            class="my-5"
          />
          <section>
            <h3
              v-if="showAll"
              class="mb-3 text-base font-semibold"
            >
              {{ facet.attributeName }}
            </h3>
            <div class="space-y-2.5">
              <UCheckbox
                v-for="option in facet.options"
                :key="option.optionKey"
                :name="`sheet-attribute-facet-${facet.facetKey}-${option.optionKey}`"
                :disabled="option.disabled"
                :model-value="isOptionSelected(facet.facetKey, option.optionKey)"
                :label="option.value"
                :ui="option.disabled ? { inner: 'ms-1.5', label: 'text-text-muted' } : { inner: 'ms-1.5' }"
                @update:model-value="toggleOption(facet, option, $event)"
              />
            </div>
          </section>
        </template>

        <template v-if="showAll">
          <UDivider class="my-5" />
          <section>
            <h3 class="mb-3 text-base font-semibold">
              Shop By Price
            </h3>
            <MinMaxPrice
              :price="draft.price"
              :min-price="draft.minPrice"
              :max-price="draft.maxPrice"
              :options="pricePresetOpts"
              @update:price="draft.price = $event as PricePresetId"
              @update:min-price="draft.minPrice = $event"
              @update:max-price="draft.maxPrice = $event"
            />
          </section>
        </template>
      </div>

      <div class="grid grid-cols-2 gap-3 border-t border-border-subtle px-5 py-4">
        <UButton
          block
          size="lg"
          color="gray"
          :disabled="draftCount === 0"
          @click="clearDraft"
        >
          Clear ({{ draftCount }})
        </UButton>
        <UButton
          block
          size="lg"
          @click="apply"
        >
          Apply
        </UButton>
      </div>
    </div>
  </USlideover>
</template>
