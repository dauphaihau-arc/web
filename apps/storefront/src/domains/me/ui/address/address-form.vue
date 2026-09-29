<script setup lang="ts">
import { ADDRESS_CONFIG } from '@arc/enums/address'
import { addressFormSchema } from '@arc/schemas/forms/address/address-form.schema'
import { guestCheckoutFormSchema } from '@arc/schemas/guest-checkout.schema'
import type { FormSubmitEvent } from '#ui/types'
import { useGetCountries, useGetStatesByCountry } from '~/domains/location/queries/countries.query'
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

const schema = computed(() => props.guest ? guestCheckoutFormSchema : addressFormSchema)

const {
  data: dataGetCountries,
  isPending: isPendingGetCountries,
} = useGetCountries()

const {
  data: dataGetStatesByCountry,
  isFetching: isFetchingGetStates,
  refetch: refetchGetStatesByCountry,
} = useGetStatesByCountry(computed(() => state.value.country))

const countriesOptions = computed(() => {
  return dataGetCountries.value?.data.map(co => co.name) || []
})

const stateOptions = computed(() => {
  return dataGetStatesByCountry.value?.data.states.map(st => st.name) || []
})

watch(() => state.value.country, () => {
  state.value.state = undefined
  state.value.zip = undefined
  refetchGetStatesByCountry()
})

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
      name="country"
      class="mb-4"
    >
      <USelectMenu
        v-model="state.country"
        searchable
        :loading="isPendingGetCountries"
        :options="countriesOptions"
        size="lg"
      />
    </UFormGroup>

    <div class="mb-4 flex gap-3">
      <UFormGroup
        required
        label="State/Province"
        name="state"
        class="w-1/2"
      >
        <USelectMenu
          v-model="state.state"
          searchable
          :loading="isFetchingGetStates"
          :disabled="!state.country || isFetchingGetStates"
          :options="stateOptions"
          size="lg"
          trailing
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
