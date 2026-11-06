<script setup lang="ts">
import { ADDRESS_CONFIG } from '@arc/enums/address'
import type { FormSubmitEvent } from '#ui/types'
import type {
  GetUserAddressesResponse,
  UpdateUserAddressRequest,
} from '~/domains/me/api/address/contracts/address.contract'
import { toastCustom } from '~/shared/config/toast'
import { useUpdateUserAddress } from '~/domains/me/mutations/address/update-address.mutation'
import { useGetAdministrativeAreas, useGetCountries } from '~/domains/location/queries/countries.query'
import { findCountry, findCountryCode } from '~/domains/location/utils/find-country-code'
import { hydrateAddressCodes, toSavedAddressRequest } from '~/domains/me/ui/address/address-payload'
import { createCodedAddressFormSchema } from '~/domains/me/ui/address/address-form.schema'
import type { AddressFormState } from '~/domains/me/ui/address/address-form.types'

type UserAddress = GetUserAddressesResponse['results'][number]

const props = defineProps<{ dataEdit: UserAddress }>()

const toast = useToast()
const dialog = useModal()
const queryClient = useQueryClient()

const formRef = ref()

const stateSubmit = reactive<AddressFormState>({
  full_name: props.dataEdit.full_name,
  address_1: props.dataEdit.address_1,
  address_2: props.dataEdit.address_2,
  city: props.dataEdit.city,
  country: props.dataEdit.country,
  country_code: props.dataEdit.country_code ?? undefined,
  state: props.dataEdit.state,
  state_code: props.dataEdit.state_code ?? undefined,
  zip: props.dataEdit.zip,
  phone: props.dataEdit.phone,
  is_primary: props.dataEdit.is_primary,
})

const {
  data: dataGetCountries,
  isPending: isPendingGetCountries,
} = useGetCountries()

/**
 * Older rows have no codes, so the country and subdivision are resolved from
 * the Arc reference data by display name (or by a stored code) for display.
 */
const selectedCountryCode = computed(() =>
  findCountryCode(dataGetCountries.value, stateSubmit.country_code ?? stateSubmit.country))

const selectedCountry = computed(() =>
  findCountry(dataGetCountries.value, selectedCountryCode.value))

const hasAdministrativeAreas = computed(() =>
  selectedCountry.value?.has_administrative_areas ?? false)

const {
  data: dataGetAdministrativeAreas,
  isFetching: isPendingGetStates,
} = useGetAdministrativeAreas(selectedCountryCode)

const schema = computed(() => createCodedAddressFormSchema(hasAdministrativeAreas.value))

const subdivisionFieldName = computed(() =>
  hasAdministrativeAreas.value ? 'state_code' : 'state_text')

watch(
  [dataGetCountries, dataGetAdministrativeAreas, hasAdministrativeAreas],
  () => {
    hydrateAddressCodes(
      stateSubmit,
      dataGetCountries.value,
      dataGetAdministrativeAreas.value,
    )
  },
  { immediate: true },
)

function onCountryChange(countryCode: string | undefined) {
  stateSubmit.country_code = countryCode
  stateSubmit.country = findCountry(dataGetCountries.value, countryCode)?.name
  stateSubmit.state_code = undefined
  stateSubmit.state_text = undefined
  stateSubmit.state = undefined
  stateSubmit.zip = undefined
}

function onStateCodeChange(stateCode: string | undefined) {
  stateSubmit.state_code = stateCode
  stateSubmit.state = dataGetAdministrativeAreas.value
    ?.find(area => area.code === stateCode)?.name
}

function onStateTextChange(stateText: string | undefined) {
  stateSubmit.state_text = stateText
  stateSubmit.state = stateText
}

const {
  mutateAsync: updateUserAddress,
  isPending: isPendingUpdateAddress,
} = useUpdateUserAddress()

async function onSubmit(event: FormSubmitEvent<AddressFormState>) {
  formRef.value.clear()
  try {
    const payload: UpdateUserAddressRequest = {
      ...toSavedAddressRequest(event.data),
      id: props.dataEdit.id,
    }
    await updateUserAddress(payload)
    await queryClient.invalidateQueries({
      queryKey: ['get-user-addresses'],
    })
    await dialog.close()
  }
  catch {
    toast.add({
      ...toastCustom.error,
      title: 'Update address failed',
    })
  }
}
</script>

<template>
  <BaseDialog
    :ui="{
      modal: {
        inner: '-top-10',
      },
    }"
    title="Update address"
  >
    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :state="stateSubmit"
      :schema="schema"
      @submit="onSubmit"
    >
      <UFormGroup
        required
        label="Full Name"
        name="full_name"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.full_name"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_FULL_NAME"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Street UserAddress"
        name="address_1"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.address_1"
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
          v-model="stateSubmit.address_2"
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
          v-model="stateSubmit.city"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_CITY"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Country"
        name="country_code"
        class="mb-4"
      >
        <USelectMenu
          v-model="stateSubmit.country_code"
          searchable
          :disabled="isPendingGetCountries"
          :placeholder="stateSubmit.country"
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
            v-model="stateSubmit.state_code"
            searchable
            :disabled="!selectedCountryCode || isPendingGetStates"
            :placeholder="stateSubmit.state"
            :options="dataGetAdministrativeAreas ?? []"
            value-attribute="code"
            option-attribute="name"
            size="lg"
            trailing
            @update:model-value="onStateCodeChange"
          />
          <UInput
            v-else
            v-model="stateSubmit.state_text"
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
            v-model="stateSubmit.zip"
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
          v-model="stateSubmit.phone"
          v-numeric
          size="lg"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_PHONE"
          type="phone"
        />
      </UFormGroup>

      <UCheckbox
        v-model="stateSubmit.is_primary"
        label="Set as default"
        name="is_primary"
      />
    </UForm>

    <template #footer>
      <DialogActions>
        <UButton
          size="md"
          color="gray"
          :disabled="isPendingUpdateAddress"
          @click="dialog.close"
        >
          Cancel
        </UButton>
        <UButton
          size="md"
          type="submit"
          :loading="isPendingUpdateAddress"
          @click="formRef?.submit"
        >
          Save
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
