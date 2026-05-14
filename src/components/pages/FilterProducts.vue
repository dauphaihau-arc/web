<script setup lang="ts">
import { PRODUCT_WHO_MADE } from '~/config/enums/product'

const route = useRoute()
const router = useRouter()

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
    value: PRODUCT_WHO_MADE.I_DID,
    label: 'Handmade',
  },
  // {
  //   id: PRODUCT_WHO_MADE.COLLECTIVE,
  //   label: 'A member of my shop',
  // },
  // {
  //   id: PRODUCT_WHO_MADE.SOMEONE_ELSE,
  //   label: 'Another company or person',
  // },
]

const defaultValuesState = computed(() => {
  const base = {
    isDigital: 'all',
    price: 'all',
    whoMade: 'all',
  }

  const isDigital = route.query.isDigital
  if (isDigital) {
    const found = isDigitalOpts.find(item => item.value.toString() === isDigital)
    base.isDigital = (found?.value && found.value) || 'all'
  }
  const whoMade = route.query.whoMade
  if (whoMade) {
    const found = productWhoMadeOpts.find(item => item.value === whoMade)
    base.whoMade = (found?.value && found.value) || 'all'
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

type StateKeys = keyof typeof defaultValuesState.value

watch(state, () => {
  const routeQuery = { ...route.query } as typeof defaultValuesState.value
  Object.keys(state).forEach((key) => {
    if (state[key as StateKeys] !== 'all') {
      routeQuery[key as StateKeys] = state[key as StateKeys]
    }
    else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete routeQuery[key as StateKeys]
    }
  })
  router.push({ query: routeQuery })
})
</script>

<template>
  <div>
    <UFormGroup
      label="Item format"
      name="isDigital"
      class="mb-4"
    >
      <RadioGroupInput
        v-model="state.isDigital"
        :options="isDigitalOpts"
      />
    </UFormGroup>

    <UFormGroup
      label="Item type"
      name="whoMade"
      class="mb-4"
    >
      <RadioGroupInput
        v-model="state.whoMade"
        :options="productWhoMadeOpts"
      />
    </UFormGroup>
  </div>
</template>

<style scoped>

</style>
