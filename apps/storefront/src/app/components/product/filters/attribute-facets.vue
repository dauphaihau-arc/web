<script setup lang="ts">
import type { Category } from '@arc/models/category'
import type { AttributeFilter } from '~/app/components/product/filters/product-filter.constants'
import { categoryApi } from '~/shared/api/category/category.api'
import { normalizeCategory } from '~/shared/server-state/category/category.types'
import { useGetProductFacets } from '~/shared/server-state/product/products.query'

const props = defineProps<{
  categoryId?: Category['id']
  featuredFacetKeys?: string[]
  modelValue: AttributeFilter[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AttributeFilter[]]
}>()

const state = ref<AttributeFilter[]>([])

const facetParams = computed(() => {
  if (!props.categoryId) {
    return undefined
  }

  return {
    category_id: props.categoryId,
  }
})

const {
  data: dataGetProductFacets,
  isPending: isPendingGetProductFacets,
} = useGetProductFacets(facetParams)

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
  return isPendingGetProductFacets.value || isPendingGetChildCategories.value
})

const skeletonOptionWidths = ['w-24', 'w-32', 'w-28', 'w-36']

const visibleFacets = computed(() => {
  const facets = dataGetProductFacets.value?.facets ?? []
  const childCategories = dataChildCategories.value ?? []
  const hasChildren = childCategories.length > 0

  if (!hasChildren) {
    return facets
  }

  const allowedFacetKeys = props.featuredFacetKeys

  if (!allowedFacetKeys) {
    return facets
  }

  return facets.filter(facet => allowedFacetKeys.includes(facet.facet_key))
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
      :key="facet.facet_key"
      :label="facet.attribute_name"
      class="mb-4"
    >
      <div class="space-y-1">
        <UCheckbox
          v-for="option in facet.options || []"
          :id="getAttributeOptionId(facet.facet_key, option.option_key)"
          :key="option.option_key"
          :name="getAttributeOptionId(facet.facet_key, option.option_key)"
          :ui="{ inner: 'ms-1.5' }"
          :model-value="isAttributeOptionSelected(facet.facet_key, option.option_key)"
          :label="option.value"
          @update:model-value="toggleAttributeOption(facet.facet_key, facet.attribute_name, option.option_key, option.value, $event)"
        />
      </div>
    </UFormGroup>
  </template>
</template>
