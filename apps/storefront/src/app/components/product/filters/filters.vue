<script setup lang="ts">
import { ProductWhoMade } from '@arc/enums/product'
import type { Category } from '@arc/models/category'
import AttributeFacets from '~/app/components/product/filters/attribute-facets.vue'

const route = useRoute()
const router = useRouter()
const marketStore = useMarketStore()
const props = defineProps<{
  categoryId?: Category['id']
}>()

type AttributeFilter = {
  facet_key: string
  attribute_name: string
  selected_option_keys: string[]
  selected_option_values: string[]
}

const isDigitalOpts = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Digital' },
  { value: 'false', label: 'Physical' },
]

// const priceOpts = [
//   { value: 'all', label: 'Any price' },
//   { value: 'custom', label: 'Custom' },
// ];

const productWhoMadeOpts = [
  {
    value: 'all',
    label: 'All',
  },
  {
    value: ProductWhoMade.I_DID,
    label: 'Handmade',
  },
  // {
  //   id: ProductWhoMade.COLLECTIVE,
  //   label: 'A member of my shop',
  // },
  // {
  //   id: ProductWhoMade.SOMEONE_ELSE,
  //   label: 'Another company or person',
  // },
]

function parseAttributeFilters(query: Record<string, unknown>): AttributeFilter[] {
  return Object.entries(query).flatMap(([key, rawValue]) => {
    const match = /^attr_(.+)$/.exec(key)

    if (!match?.[1]) {
      return []
    }

    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'string'
        ? [rawValue]
        : []
    const selectedOptionIds = values
      .flatMap(value => value.split(','))
      .map(value => value.trim())
      .filter(Boolean)

    if (selectedOptionIds.length === 0) {
      return []
    }

    return [{
      facet_key: match[1],
      attribute_name: '',
      selected_option_keys: Array.from(new Set(selectedOptionIds)),
      selected_option_values: Array.from(new Set(selectedOptionIds)),
    }]
  })
}

const defaultValuesState = computed(() => {
  const base = {
    is_digital: 'all',
    price: 'all',
    who_made: 'all',
    attribute_filters: parseAttributeFilters(route.query),
  }

  const isDigital = route.query.is_digital
  if (isDigital) {
    const found = isDigitalOpts.find(item => item.value.toString() === isDigital)
    base.is_digital = (found?.value && found.value) || 'all'
  }
  const whoMade = route.query.who_made
  if (whoMade) {
    const found = productWhoMadeOpts.find(item => item.value === whoMade)
    base.who_made = (found?.value && found.value) || 'all'
  }
  // const order = route.query['order'];
  // if (order) {
  //   const foundOption = options.find(opt => opt.id === order);
  //   if (foundOption) return foundOption;
  // }
  // return options[0];
  return base
})

const state = reactive(defaultValuesState.value)

const isResetDisabled = computed(() => {
  return state.is_digital === 'all'
    && state.price === 'all'
    && state.who_made === 'all'
    && state.attribute_filters.length === 0
})

const currentCategory = computed(() => {
  if (!props.categoryId) {
    return undefined
  }

  return marketStore.categoriesBreadcrumb.find(category => category.id === props.categoryId)
})

type StateKeys = keyof typeof defaultValuesState.value
const controlledQueryKeys = new Set<StateKeys>([
  'is_digital',
  'price',
  'who_made',
  'attribute_filters',
])

watch(state, () => {
  const routeQuery = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => {
      return !/^attr_.+/.test(key)
        && !controlledQueryKeys.has(key as StateKeys)
    }),
  ) as Record<string, string>
  Object.keys(state).forEach((key) => {
    const value = state[key as StateKeys]

    if (key === 'attribute_filters') {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((filter) => {
          if (!filter.facet_key || filter.selected_option_keys.length === 0) {
            return
          }

          routeQuery[`attr_${filter.facet_key}`] = filter.selected_option_keys.join(',')
        })
      }
      return
    }

    if (typeof value === 'string' && value !== 'all') {
      routeQuery[key] = value
    }
  })
  router.push({ query: routeQuery })
})

function resetFilters() {
  state.is_digital = 'all'
  state.price = 'all'
  state.who_made = 'all'
  state.attribute_filters = []
}
</script>

<template>
  <div class="pr-2">
    <UFormGroup
      label="Item format"
      name="is_digital"
      class="mb-4"
    >
      <RadioGroupInput
        v-model="state.is_digital"
        :options="isDigitalOpts"
      />
    </UFormGroup>

    <UFormGroup
      label="Item type"
      name="who_made"
      class="mb-4"
    >
      <RadioGroupInput
        v-model="state.who_made"
        :options="productWhoMadeOpts"
      />
    </UFormGroup>

    <AttributeFacets
      v-model="state.attribute_filters"
      :category-id="props.categoryId"
      :featured-facet-keys="currentCategory?.featuredFacetKeys"
    />

    <UButton
      block
      class="mt-6"
      :disabled="isResetDisabled"
      @click="resetFilters"
    >
      Reset filters
    </UButton>
  </div>
</template>
