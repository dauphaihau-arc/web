<script setup lang="ts">
import { ProductWhoMade } from '@arc/enums/product'

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

const defaultValuesState = computed(() => {
  const base = {
    is_digital: 'all',
    price: 'all',
    who_made: 'all',
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

type StateKeys = keyof typeof defaultValuesState.value

watch(state, () => {
  const routeQuery = { ...route.query } as Record<string, string>
  Object.keys(state).forEach((key) => {
    if (state[key as StateKeys] !== 'all') {
      routeQuery[key] = state[key as StateKeys]
    }
    else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete routeQuery[key]
    }
  })
  router.push({ query: routeQuery })
})
</script>

<template>
  <div>
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
  </div>
</template>

<style scoped>

</style>
