<script setup lang="ts">
import type { Category } from '@arc/models/category'
import type { AttributeFilter } from '~/domains/product/ui/filters/product-filter.constants'
import { categoryApi } from '~/domains/category/api/category.api'
import { normalizeCategory } from '~/domains/category/utils/category.normalizer'
import { buildFacetOptionView } from '~/domains/product/ui/filters/facet-option-view'
import {
  buildFacetBaselineQuery,
  buildFacetRequestQuery,
} from '~/domains/product/ui/filters/product-filter-query'
import { useGetProductFacets } from '~/domains/product/queries/products.query'

const props = defineProps<{
  categoryId?: Category['id']
  featuredFacetKeys?: string[]
  modelValue: AttributeFilter[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AttributeFilter[]]
}>()

const route = useRoute()
const state = ref<AttributeFilter[]>([])

// Facet alternatives are computed by the backend with every active filter
// except each facet's own, so the request must carry the full active filter set
// the listing uses. Pagination and sorting are deliberately omitted.
const facetParams = computed(() => {
  if (!props.categoryId) {
    return undefined
  }

  return buildFacetRequestQuery(props.categoryId, route.query)
})

const {
  data: dataGetProductFacets,
  isPending: isPendingGetProductFacets,
} = useGetProductFacets(facetParams)

// The same category-scoped facet endpoint without the active filters: the
// eligible options before any shopper selection narrows them. It shares the
// filtered query's cache, market context, and eligibility rules, but its own
// query key means a previously visited filter state can never be mistaken for
// the baseline. Only the filtered response above decides availability.
const baselineFacetParams = computed(() => {
  if (!props.categoryId) {
    return undefined
  }

  return buildFacetBaselineQuery(props.categoryId)
})

const {
  data: dataBaselineFacets,
  isPending: isPendingBaselineFacets,
} = useGetProductFacets(baselineFacetParams)

const {
  data: dataChildCategories,
  isPending: isPendingGetChildCategories,
} = useQuery<Category[]>({
  enabled: computed(() => !!props.categoryId),
  queryKey: computed(() => ['get-child-categories', props.categoryId]),
  queryFn: async () => {
    if (!props.categoryId) {
      return []
    }

    const response = await categoryApi.getCategories({
      parent_id: props.categoryId,
    })

    return response.map(normalizeCategory)
  },
})

const isLoading = computed(() => {
  return isPendingGetProductFacets.value
    || isPendingBaselineFacets.value
    || isPendingGetChildCategories.value
})

const skeletonOptionWidths = ['w-24', 'w-32', 'w-28', 'w-36']

const visibleFacets = computed(() => {
  const facets = buildFacetOptionView({
    baselineFacets: dataBaselineFacets.value?.facets ?? [],
    filteredFacets: dataGetProductFacets.value?.facets ?? [],
    selections: state.value,
    // The filtered response is keyed by the active filters, so when it exists
    // it describes the current selection. While it is pending or errored there
    // is no availability signal, so unselected options stay disabled until it
    // resolves rather than being enabled from stale data.
    hasFilteredAvailability: dataGetProductFacets.value !== undefined,
  })
  const childCategories = dataChildCategories.value ?? []
  const hasChildren = childCategories.length > 0

  if (!hasChildren) {
    return facets
  }

  const allowedFacetKeys = props.featuredFacetKeys

  if (!allowedFacetKeys) {
    return facets
  }

  return facets.filter(facet => allowedFacetKeys.includes(facet.facetKey))
})

watch(
  () => props.modelValue,
  (value) => {
    state.value = value.map(filter => ({
      ...filter,
      selectedOptionKeys: [...filter.selectedOptionKeys],
      selectedOptionValues: [...filter.selectedOptionValues],
    }))
  },
  { immediate: true },
)

function toggleAttributeOption(
  facetKey: string,
  attributeName: string,
  optionKey: string,
  optionValue: string,
  checked: boolean,
) {
  const filters = [...state.value]
  const existing = filters.find(filter => filter.facetKey === facetKey)

  if (!existing && checked) {
    state.value = [
      ...filters,
      {
        facetKey,
        attributeName,
        selectedOptionKeys: [optionKey],
        selectedOptionValues: [optionValue],
      },
    ]
    emit('update:modelValue', state.value)
    return
  }

  if (!existing) {
    return
  }

  const selectedOptionKeys = checked
    ? Array.from(new Set([...existing.selectedOptionKeys, optionKey]))
    : existing.selectedOptionKeys.filter(value => value !== optionKey)
  const selectedOptionValues = checked
    ? Array.from(new Set([...existing.selectedOptionValues, optionValue]))
    : existing.selectedOptionValues.filter(value => value !== optionValue)

  state.value = selectedOptionKeys.length > 0
    ? filters.map(filter =>
        filter.facetKey === facetKey
          ? {
              ...filter,
              attributeName,
              selectedOptionKeys,
              selectedOptionValues,
            }
          : filter,
      )
    : filters.filter(filter => filter.facetKey !== facetKey)

  emit('update:modelValue', state.value)
}

function isAttributeOptionSelected(facetKey: string, optionKey: string) {
  return state.value.some(filter =>
    filter.facetKey === facetKey
    && filter.selectedOptionKeys.includes(optionKey),
  )
}

function getAttributeOptionId(facetKey: string, optionKey: string) {
  return `attribute-facet-${facetKey}-${optionKey}`
}

function getOptionUi(disabled: boolean) {
  return disabled
    ? { inner: 'ms-1.5', label: 'text-text-muted' }
    : { inner: 'ms-1.5' }
}
</script>

<template>
  <template v-if="isLoading">
    <div
      v-for="index in 3"
      :key="index"
      class="mb-6 space-y-3"
    >
      <USkeleton class="h-5 w-28" />
      <div class="space-y-2">
        <div
          v-for="optionIndex in 4"
          :key="optionIndex"
          class="flex items-center gap-1.5"
        >
          <USkeleton class="size-4 rounded" />
          <USkeleton :class="['h-4', skeletonOptionWidths[(optionIndex - 1) % skeletonOptionWidths.length]]" />
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <UFormGroup
      v-for="facet in visibleFacets"
      :key="facet.facetKey"
      :label="facet.attributeName"
      class="mb-4"
    >
      <div class="space-y-1">
        <UCheckbox
          v-for="option in facet.options"
          :id="getAttributeOptionId(facet.facetKey, option.optionKey)"
          :key="option.optionKey"
          :name="getAttributeOptionId(facet.facetKey, option.optionKey)"
          :ui="getOptionUi(option.disabled)"
          :disabled="option.disabled"
          :model-value="isAttributeOptionSelected(facet.facetKey, option.optionKey)"
          :label="option.value"
          @update:model-value="toggleAttributeOption(facet.facetKey, facet.attributeName, option.optionKey, option.value, $event)"
        />
      </div>
    </UFormGroup>
  </template>
</template>
