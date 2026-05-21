<script setup lang="ts">
import { useGetCountries } from '~/shared/server-state/location/countries.query'
import type { ProductStandardShipping } from '~/shared/models/product'
import {
  ProductShippingCharge,
  PRODUCT_SHIPPING_CONFIG,
  ProductShippingOtherCountriesOptions,
  ProductShippingServices,
} from '~/shared/config/enums/product'

const emit = defineEmits<{
  delete: []
  onChange: [value: ProductStandardShipping]
}>()

defineProps<{
  index: number
  disabledDelete: boolean
}>()

const model = defineModel<Partial<ProductStandardShipping>>({
  required: true,
})

const { data: dataGetCountries } = useGetCountries()

const chargeOptions = [
  { id: ProductShippingCharge.FREE_SHIPPING, label: 'Free shipping' },
  { id: ProductShippingCharge.FIXED_PRICE, label: 'Fixed price', disabled: true },
]

const shippingServiceOptions = [ProductShippingServices.OTHER]

const deliveryTimeOptions = new Array(PRODUCT_SHIPPING_CONFIG.MAX_DAYS_DELIVERY)
  .fill('')
  .map((_, idx) => (idx + 1)
    .toString())

// ------------------ Models
const stateDeliveryTime = reactive({
  from: 0,
  to: 0,
})

// ------------------ Computed ref
const countriesOptions = computed(() => {
  if (dataGetCountries.value) {
    const countries = dataGetCountries.value.data
      .filter(country => country.Iso2)
      .map(country => ({
        label: country.name,
        value: country.Iso2!,
      }))

    return [
      {
        label: ProductShippingOtherCountriesOptions.EVERYWHERE,
        value: ProductShippingOtherCountriesOptions.EVERYWHERE,
      },
      ...countries,
    ]
  }
  return []
})

const countryLabel = computed(() => {
  const selectedCountry = countriesOptions.value.find(
    option => option.value === model.value.country,
  )

  return selectedCountry?.label ?? model.value.country
})

const deliveryTimeToOptions = computed(() => {
  if (stateDeliveryTime.from) {
    return deliveryTimeOptions.slice(stateDeliveryTime.from)
  }
  return deliveryTimeOptions.slice(1)
})

const charge = computed({
  get() {
    return (model.value?.charge && chargeOptions.find(opt => opt.id === model.value.charge)) || chargeOptions[0]
  },
  set(newValue) {
    model.value.charge = newValue.id
  },
})

// ----------------- Lifecycle Hooks
onMounted(() => {
  if (model.value.delivery_time) {
    const [from, to] = model.value.delivery_time.split('-')
    stateDeliveryTime.from = Number(from)
    stateDeliveryTime.to = Number(to)
  }
})

// ----------------- Side effects
watch(stateDeliveryTime, () => {
  if (stateDeliveryTime.from && stateDeliveryTime.to && stateDeliveryTime.from < stateDeliveryTime.to) {
    model.value.delivery_time = `${stateDeliveryTime.from}-${stateDeliveryTime.to}d`
  }
  else if (stateDeliveryTime.from >= stateDeliveryTime.to) {
    stateDeliveryTime.to = 0
  }
})
</script>

<template>
  <div class="rounded-md border-2 border-dashed p-4 px-5">
    <div class="mb-2 flex justify-between">
      <div class="text-lg font-medium">
        {{ countryLabel }}
      </div>
      <UButton
        v-if="!disabledDelete"
        variant="ghost"
        icon="i-heroicons-x-mark"
        color="gray"
        @click="emit('delete')"
      />
    </div>
    <UFormGroup
      v-if="!model.country"
      required
      label="Country"
      :name="`standard_shipping.${index}.country`"
      class="mb-4"
    >
      <USelectMenu
        v-model="model.country"
        :options="countriesOptions"
        option-attribute="label"
        value-attribute="value"
        size="xl"
      />
    </UFormGroup>

    <UFormGroup
      required
      label="Shipping service"
      :name="`standard_shipping.${index}.service`"
      class="mb-4"
    >
      <USelectMenu
        v-model="model.service"
        :options="shippingServiceOptions"
        size="xl"
      />
    </UFormGroup>
    <UFormGroup
      required
      label="Delivery time"
      :name="`standard_shipping.${index}.delivery_time`"
      description="Business days"
      class="mb-4 w-1/2"
    >
      <div class="flex items-center gap-3">
        <USelectMenu
          v-model="stateDeliveryTime.from"
          class="w-1/2"
          :options="deliveryTimeOptions"
          size="xl"
        />
        <div>to</div>
        <USelectMenu
          v-model="stateDeliveryTime.to"
          class="w-1/2"
          :options="deliveryTimeToOptions"
          size="xl"
        />
      </div>
    </UFormGroup>
    <UFormGroup
      required
      label="What you'll charge"
      name="charge"
      class="mb-4"
    >
      <USelectMenu
        v-model="charge"
        :options="chargeOptions"
        size="xl"
      />
    </UFormGroup>
  </div>
</template>

<style scoped>

</style>
