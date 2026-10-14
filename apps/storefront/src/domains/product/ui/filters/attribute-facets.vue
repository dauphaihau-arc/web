<script setup lang="ts">
import type { Category } from '@arc/models/category'
import type { AttributeFilter } from '~/domains/product/ui/filters/product-filter.constants'
import { toggleFacetSelection } from '~/domains/product/ui/filters/facet-option-view'
import { useProductFacets } from '~/domains/product/ui/filters/use-product-facets'

const props = defineProps<{
  categoryId?: Category['id']
  featuredFacetKeys?: string[]
  modelValue: AttributeFilter[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AttributeFilter[]]
}>()

const state = ref<AttributeFilter[]>([])

const { facets: visibleFacets, isLoading } = useProductFacets({
  categoryId: () => props.categoryId,
  selections: () => state.value,
  featuredFacetKeys: () => props.featuredFacetKeys,
})

const skeletonOptionWidths = ['w-24', 'w-32', 'w-28', 'w-36']

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
  state.value = toggleFacetSelection(state.value, {
    facetKey,
    attributeName,
    optionKey,
    optionValue,
    checked,
  })

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
