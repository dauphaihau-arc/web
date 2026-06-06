<script setup lang="ts">
import { ADDRESS_CONFIG } from '@arc/enums/address'
import { ProductShippingCharge, ProductShippingServices } from '@arc/enums/product'
import LocationShipping from './location-shipping.vue'
import { createProductShippingFormSchema } from '~/shared/schemas/forms/shop/product/create-product-form.schema'
import type { FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { useGetCountries } from '~/shared/server-state/location/countries.query'
import type { CreateProductShipping } from '~/shared/api/shop/product/contracts/form.contract'

type ShippingLocation = CreateProductShipping['standard_shipping'][number]
type TStateSubmit = Partial<Pick<CreateProductShipping, 'country' | 'zip' | 'process_time'>> & {
  standard_shipping: Partial<ShippingLocation>[]
}

const emit = defineEmits<{
  apply: [value: CreateProductShipping]
}>()

const props = defineProps<{
  initData?: CreateProductShipping
}>()

const modal = useModal()
const marketStore = useMarketStore()
const { data: dataGetCountries } = useGetCountries()

const processTimeOptions = [
  {
    id: '1d',
    label: '1 day',
  },
  {
    id: '1-2d',
    label: '1-2 days (Recommended)',
  },
  {
    id: '1-3d',
    label: '1-3 days',
  },
]

const countriesOptions = computed(() => {
  if (dataGetCountries.value) {
    return dataGetCountries.value.data
      .filter(country => country.Iso2)
      .map(country => ({
        label: country.name,
        value: country.Iso2!,
      }))
  }
  return []
})

const processTimeIdSelected = ref(processTimeOptions[0].id)

const stateSubmit = reactive<TStateSubmit>({
  process_time: processTimeIdSelected.value,
  standard_shipping: [],
})

const keyAnotherLocationList = ref(0)
const keyValidateLocations = ref(0)
const formRef = ref()

const ensureOriginShipping = () => {
  if (!stateSubmit.standard_shipping[0]) {
    stateSubmit.standard_shipping.unshift({
      service: ProductShippingServices.OTHER,
      charge: ProductShippingCharge.FREE_SHIPPING,
    })
  }

  return stateSubmit.standard_shipping[0]
}

onMounted(() => {
  if (props.initData) {
    Object.assign(stateSubmit, props.initData)
    ensureOriginShipping()
    return
  }
  if (marketStore.guestPreferences?.region) {
    const region = marketStore.guestPreferences.region
    const selectedCountry = dataGetCountries.value?.data.find(country =>
      country.Iso2 === region || country.name === region,
    )

    stateSubmit.country = selectedCountry?.Iso2 ?? region
    ensureOriginShipping().country = stateSubmit.country
  }
})

const addLocation = () => {
  stateSubmit.standard_shipping.push({
    service: ProductShippingServices.OTHER,
    charge: ProductShippingCharge.FREE_SHIPPING,
  })
}

const deleteLocation = (idx: number) => {
  stateSubmit.standard_shipping = stateSubmit.standard_shipping.filter((_value, index) => index !== idx)
  keyAnotherLocationList.value++
  keyValidateLocations.value = 0
}

function onSubmit(event: FormSubmitEvent<CreateProductShipping>) {
  emit('apply', event.data)
  modal.close()
}

watch(() => stateSubmit.country, () => {
  ensureOriginShipping().country = stateSubmit.country
})

async function onError(event: FormErrorEvent) {
  const element = document.getElementById(event.errors[0].id)
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <BaseDialog
    title="Add custom shipping settings"
    description="We use these settings to calculate shipping costs and estimated delivery dates for buyers."
  >
    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :state="stateSubmit"
      class="space-y-4"
      :schema="createProductShippingFormSchema"
      @error="onError"
      @submit="onSubmit"
    >
      <UFormGroup
        required
        label="Country of origin"
        name="country"
        description="The country you're shipping from"
        class="mb-4 flex w-full justify-between"
        :ui="{ container: 'w-[61%]', description: 'w-36 text-xs' }"
      >
        <USelectMenu
          v-model="stateSubmit.country"
          searchable
          :options="countriesOptions"
          option-attribute="label"
          value-attribute="value"
          size="xl"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Origin postal code"
        description="Where will your orders ship from—home, the post office, or another location?"
        name="zip"
        class="mb-4 flex w-full gap-[62px]"
        :ui="{ container: 'w-1/4', description: 'w-36 text-xs' }"
      >
        <UInput
          v-model="stateSubmit.zip"
          v-numeric
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_ZIP"
          size="xl"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Processing time"
        description="How much time do you need to prepare an order and put it in the mail? "
        name="process_time"
        class="mb-4 flex w-full gap-[62px]"
        :ui="{ container: 'w-1/3', description: 'w-36 text-xs' }"
      >
        <USelectMenu
          v-model="processTimeIdSelected"
          :options="processTimeOptions"
          size="xl"
          value-attribute="id"
        />
      </UFormGroup>

      <UDivider />

      <UFormGroup
        required
        label="Standard shipping"
        description="Where will you ship to? We’ll show your listings to shoppers in the countries you add here. Estimate your shipping costsOpens a new tab"
        class="mb-4"
      />

      <div
        :key="keyAnotherLocationList"
        class="space-y-5"
      >
        <div
          v-for="(_item, idx) of stateSubmit.standard_shipping"
          :key="idx"
        >
          <LocationShipping
            v-model="stateSubmit.standard_shipping[idx]"
            :key-validate="keyValidateLocations"
            :index="idx"
            :disabled-delete="idx === 0"
            @delete="deleteLocation(idx)"
          />
        </div>
      </div>
      <UButton
        color="gray"
        icon="i-heroicons-plus"
        @click="addLocation"
      >
        Add another location
      </UButton>
    </UForm>

    <template #footer>
      <DialogActions full-width>
        <UButton
          size="sm"
          color="gray"
          @click="modal.close"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          size="sm"
          @click="formRef?.submit"
        >
          Apply
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
