<script setup lang="ts">
import { ADDRESS_CONFIG } from '@arc/enums/address'
import type { FormSubmitEvent } from '#ui/types'
import { useGetAdministrativeAreas, useGetCountries } from '~/domains/location/queries/countries.query'
import { findCountry, findCountryCode } from '~/domains/location/utils/find-country-code'
import { hydrateAddressCodes } from './address-payload'
import { createCodedAddressFormSchema, createGuestAddressFormSchema } from './address-form.schema'
import type { AddressFormState } from './address-form.types'

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

const {
  data: dataGetAdministrativeAreas,
  isFetching: isFetchingGetAdministrativeAreas,
} = useGetAdministrativeAreas(selectedCountryCode)

const schema = computed(() => {
  return props.guest
    ? createGuestAddressFormSchema(hasAdministrativeAreas.value)
    : createCodedAddressFormSchema(hasAdministrativeAreas.value)
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
  emit('submit', event.data)
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
    <UFormGroup
      v-if="props.guest"
      required
      label="Email"
      name="email"
      class="mb-4"
    >
      <UInput
        v-model="state.email"
        size="lg"
        type="email"
        maxlength="320"
      />
    </UFormGroup>
    <UFormGroup
      required
      label="Full Name"
      name="full_name"
      class="mb-4"
    >
      <UInput
        v-model="state.full_name"
        :maxlength="ADDRESS_CONFIG.MAX_CHAR_FULL_NAME"
        size="lg"
      />
    </UFormGroup>
    <UFormGroup
      required
      label="Street"
      name="address_1"
      class="mb-4"
    >
      <UInput
        v-model="state.address_1"
        :maxlength="ADDRESS_CONFIG.MAX_CHAR_ADDRESS"
        size="lg"
      />
    </UFormGroup>
    <UFormGroup
      label="Apt / Suite / Other"
      name="address_2"
      class="mb-4"
    >
      <UInput
        v-model="state.address_2"
        :maxlength="ADDRESS_CONFIG.MAX_CHAR_ADDRESS"
        size="lg"
      />
    </UFormGroup>
    <UFormGroup
      required
      label="City"
      name="city"
      class="mb-4"
    >
      <UInput
        v-model="state.city"
        :maxlength="ADDRESS_CONFIG.MAX_CHAR_CITY"
        size="lg"
      />
    </UFormGroup>
    <UFormGroup
      required
      label="Country"
      :name="props.guest ? 'country' : 'country_code'"
      class="mb-4"
    >
      <USelectMenu
        v-model="state.country_code"
        searchable
        :disabled="isPendingGetCountries"
        :placeholder="state.country"
        :options="dataGetCountries ?? []"
        value-attribute="code"
        option-attribute="name"
        size="lg"
        @update:model-value="onCountryChange"
      />
    </UFormGroup>

    <div class="mb-4 flex gap-3">
      <UFormGroup
        :required="hasAdministrativeAreas"
        label="State/Province"
        :name="subdivisionFieldName"
        class="w-1/2"
      >
        <USelectMenu
          v-if="hasAdministrativeAreas"
          v-model="state.state_code"
          searchable
          :loading="isFetchingGetAdministrativeAreas"
          :placeholder="state.state"
          :disabled="!selectedCountryCode || isFetchingGetAdministrativeAreas"
          :options="dataGetAdministrativeAreas ?? []"
          value-attribute="code"
          option-attribute="name"
          size="lg"
          trailing
          @update:model-value="onStateCodeChange"
        />
        <UInput
          v-else
          v-model="state.state_text"
          name="state_text"
          :disabled="!selectedCountryCode"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_CITY"
          size="lg"
          @update:model-value="onStateTextChange"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Zip/Postal code"
        name="zip"
        class="w-1/2"
      >
        <UInput
          v-model="state.zip"
          v-numeric
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_ZIP"
          size="lg"
        />
      </UFormGroup>
    </div>
    <UFormGroup
      required
      label="Phone"
      name="phone"
      class="mb-4"
    >
      <UInput
        v-model="state.phone"
        v-numeric
        size="lg"
        :maxlength="ADDRESS_CONFIG.MAX_CHAR_PHONE"
        type="phone"
      />
    </UFormGroup>

    <UCheckbox
      v-if="!props.guest"
      v-model="state.is_primary"
      label="Set as default"
      name="is_primary"
    />
  </UForm>
</template>
