<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { useGetAddressRules, useGetAdministrativeAreas, useGetCountries } from '~/domains/location/queries/countries.query'
import { findCountry, findCountryCode } from '~/domains/location/utils/find-country-code'
import { hydrateAddressCodes } from './address-payload'
import { createCodedAddressFormSchema, createGuestAddressFormSchema } from './address-form.schema'
import { fallbackAddressFieldRules, toAddressFieldRules } from './address-field-rules'
import type { AddressFormState } from './address-form.types'
import AddressFormFields from './address-form-fields.vue'

const props = withDefaults(defineProps<{
  guest?: boolean
}>(), {
  guest: false,
})

const state = defineModel<AddressFormState>('state', { required: true })

const emit = defineEmits<{
  submit: [payload: AddressFormState]
}>()

const formRef = ref()

const {
  data: dataGetCountries,
  isPending: isPendingGetCountries,
} = useGetCountries()

/**
 * The canonical code drives the select and the administrative-areas lookup;
 * legacy/guest rows that only carry a display name resolve through the Arc
 * reference data until their codes are filled in.
 */
const selectedCountryCode = computed(() =>
  findCountryCode(dataGetCountries.value, state.value.country_code ?? state.value.country))

const selectedCountry = computed(() =>
  findCountry(dataGetCountries.value, selectedCountryCode.value))

const hasAdministrativeAreas = computed(() =>
  selectedCountry.value?.has_administrative_areas ?? false)

/**
 * Postcodes are optional where the selected country says so. The label and the
 * required marker follow the same flag the schema uses.
 */
const postalCodeRequired = computed(() =>
  selectedCountry.value?.postal_code_required ?? false)

const {
  data: dataGetAdministrativeAreas,
  isFetching: isFetchingGetAdministrativeAreas,
} = useGetAdministrativeAreas(selectedCountryCode)

const { data: dataGetAddressRules } = useGetAddressRules(selectedCountryCode)

const fieldRules = computed(() => dataGetAddressRules.value
  ? toAddressFieldRules(dataGetAddressRules.value, { guest: props.guest })
  : fallbackAddressFieldRules({ guest: props.guest }))

const schema = computed(() => {
  const options = {
    countryCode: selectedCountryCode.value,
    postalCodeRequired: postalCodeRequired.value,
    subdivisionVisible: fieldRules.value.find(rule => rule.key === 'subdivision')?.visible ?? true,
    postcodeVisible: fieldRules.value.find(rule => rule.key === 'zip')?.visible ?? true,
  }

  return props.guest
    ? createGuestAddressFormSchema(hasAdministrativeAreas.value, options)
    : createCodedAddressFormSchema(hasAdministrativeAreas.value, options)
})

const subdivisionFieldName = computed(() => {
  if (!hasAdministrativeAreas.value) {
    return 'state_text'
  }
  return props.guest ? 'state' : 'state_code'
})

watch(
  [dataGetCountries, dataGetAdministrativeAreas, hasAdministrativeAreas],
  () => {
    hydrateAddressCodes(
      state.value,
      dataGetCountries.value,
      dataGetAdministrativeAreas.value,
    )
  },
  { immediate: true },
)

function onCountryChange(countryCode: string | undefined) {
  state.value.country_code = countryCode
  state.value.country = findCountry(dataGetCountries.value, countryCode)?.name
  state.value.state_code = undefined
  state.value.state_text = undefined
  state.value.state = undefined
  state.value.zip = undefined
  state.value.phone = undefined
}

function onStateCodeChange(stateCode: string | undefined) {
  state.value.state_code = stateCode
  state.value.state = dataGetAdministrativeAreas.value
    ?.find(area => area.code === stateCode)?.name
}

function onStateTextChange(stateText: string | undefined) {
  state.value.state_text = stateText
  state.value.state = stateText
}

function onSubmit(event: FormSubmitEvent<AddressFormState>) {
  // UForm reports the raw state; run the schema a second time to emit its
  // normalised output (postcode casing/spacing, phone trimming).
  const parsed = schema.value.parse(event.data) as AddressFormState

  emit('submit', { ...event.data, ...parsed })
}

defineExpose({
  submit: () => formRef.value?.submit(),
})
</script>

<template>
  <UForm
    ref="formRef"
    :validate-on="['submit']"
    :state="state"
    :schema="schema"
    @submit="onSubmit"
  >
    <AddressFormFields
      v-model:state="state"
      :guest="props.guest"
      :fields="fieldRules"
      :country-code="selectedCountryCode"
      :countries="dataGetCountries"
      :is-pending-countries="isPendingGetCountries"
      :areas="dataGetAdministrativeAreas"
      :is-fetching-areas="isFetchingGetAdministrativeAreas"
      :has-administrative-areas="hasAdministrativeAreas"
      :postal-code-required="postalCodeRequired"
      :subdivision-field-name="subdivisionFieldName"
      @country-change="onCountryChange"
      @state-code-change="onStateCodeChange"
      @state-text-change="onStateTextChange"
    />
  </UForm>
</template>
