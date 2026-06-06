<script setup lang="ts">
import { ADDRESS_CONFIG } from '@arc/enums/address'
import { addressFormSchema } from '@arc/schemas/forms/address/address-form.schema'
import type { FormSubmitEvent } from '#ui/types'
import type {
  CreateUserAddressRequest,
  GetUserAddressesResponse,
  UpdateUserAddressBody,
  UpdateUserAddressRequest,
} from '~/shared/api/me/address/contracts/address.contract'
import { toastCustom } from '~/shared/config/toast'
import { useUpdateUserAddress } from '~/shared/server-state/me/address/update-address.mutation'
import { useGetCountries, useGetStatesByCountry } from '~/shared/server-state/location/countries.query'

type UserAddress = GetUserAddressesResponse['results'][number]

const props = defineProps<{ dataEdit: UserAddress }>()

const toast = useToast()
const dialog = useModal()
const queryClient = useQueryClient()

const formRef = ref()

const stateSubmit = reactive<Partial<CreateUserAddressRequest>>({
  full_name: props.dataEdit.full_name,
  address_1: props.dataEdit.address_1,
  address_2: props.dataEdit.address_2,
  city: props.dataEdit.city,
  state: props.dataEdit.state,
  zip: props.dataEdit.zip,
  country: props.dataEdit.country,
  phone: props.dataEdit.phone,
  is_primary: props.dataEdit.is_primary,
})

const {
  data: dataGetCountries,
  isPending: isPendingGetCountries,
} = useGetCountries()

const {
  data: dataGetStatesByCountry,
  isFetching: isPendingGetStates,
  refetch: refetchGetStatesByCountry,
} = useGetStatesByCountry(computed(() => stateSubmit.country))

const {
  mutateAsync: updateUserAddress,
} = useUpdateUserAddress()

const countriesOptions = computed(() => {
  return dataGetCountries.value?.data.map(co => co.name) || []
})

const stateOptions = computed(() => {
  return dataGetStatesByCountry.value?.data.states.map(st => st.name) || []
})

onMounted(() => {
  refetchGetStatesByCountry()
})

async function onSubmit(event: FormSubmitEvent<CreateUserAddressRequest>) {
  formRef.value.clear()
  try {
    const body: UpdateUserAddressBody = {
      full_name: event.data.full_name,
      address_1: event.data.address_1,
      address_2: event.data.address_2,
      city: event.data.city,
      state: event.data.state,
      zip: event.data.zip,
      country: event.data.country,
      phone: event.data.phone,
      is_primary: event.data.is_primary,
    }
    const payload: UpdateUserAddressRequest = {
      id: props.dataEdit.id,
      ...body,
    }
    await updateUserAddress(payload)
    await queryClient.invalidateQueries({
      queryKey: ['get-user-addresses'],
    })
    await dialog.close()
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Update address failed',
    })
  }
}

watch(() => stateSubmit.country, () => {
  stateSubmit.state = undefined
  stateSubmit.zip = undefined
  refetchGetStatesByCountry()
})
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
      :schema="addressFormSchema"
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
        name="country"
        class="mb-4"
      >
        <USelectMenu
          v-model="stateSubmit.country"
          searchable
          :loading="isPendingGetCountries"
          :options="countriesOptions"
          size="lg"
        />
      </UFormGroup>

      <div class="mb-4 flex gap-3">
        <UFormGroup
          required
          label="StateCheckoutNow/Province"
          name="state"
          class="w-1/2"
        >
          <USelectMenu
            v-model="stateSubmit.state"
            searchable
            :loading="isPendingGetStates"
            :disabled="!stateSubmit.country || isPendingGetStates"
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
          @click="dialog.close"
        >
          Cancel
        </UButton>
        <UButton
          size="md"
          type="submit"
          @click="formRef?.submit"
        >
          Save
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
