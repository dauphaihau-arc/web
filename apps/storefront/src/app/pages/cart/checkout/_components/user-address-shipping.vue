<script setup lang="ts">
import { guestCheckoutFormSchema } from '@arc/schemas/guest-checkout.schema'
import { ADDRESS_CONFIG } from '@arc/enums/address'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useGetCountries, useGetStatesByCountry } from '~/shared/server-state/location/countries.query'
import { useGetUserAddresses } from '~/shared/server-state/me/address/addresses.query'
import CreateUserAddressDialog from '~/app/components/dialogs/create-user-address-dialog.vue'

const cartStore = useCartStore()
const dialog = useModal()
const { data: dataUserAuth } = useGetCurrentUser()

const isAuthenticated = computed(() => !!dataUserAuth.value?.user)

const {
  isPending: isPendingGetUserAddresses,
  data: dataUserAddress,
} = useGetUserAddresses()

const {
  data: dataGetCountries,
  isPending: isPendingGetCountries,
} = useGetCountries()

const guestState = reactive({
  email: cartStore.stateCheckoutCart.guestEmail,
  full_name: '',
  address_1: '',
  address_2: '',
  city: '',
  country: '',
  state: '',
  zip: '',
  phone: '',
})

const {
  data: dataGetStatesByCountry,
  isFetching: isFetchingGetStates,
  refetch: refetchGetStatesByCountry,
} = useGetStatesByCountry(computed(() => guestState.country))

const addressRadioOptions = computed(() => {
  if (dataUserAddress.value?.results && dataUserAddress.value.results.length > 0) {
    return dataUserAddress.value.results
  }
  return null
})

const countriesOptions = computed(() => {
  return dataGetCountries.value?.data.map(co => co.name) || []
})

const stateOptions = computed(() => {
  return dataGetStatesByCountry.value?.data.states.map(st => st.name) || []
})

const addressIdSelected = ref()

watch(addressRadioOptions, () => {
  if (isAuthenticated.value && addressRadioOptions.value && !cartStore.stateCheckoutCart.address) {
    addressIdSelected.value = addressRadioOptions.value[0].id
  }
}, { immediate: true })

watch(() => addressIdSelected.value, () => {
  if (isAuthenticated.value && dataUserAddress.value) {
    const address = dataUserAddress.value.results.find((item) => {
      return item.id === addressIdSelected.value
    })
    if (address) {
      cartStore.stateCheckoutCart.address = address
      cartStore.stateCheckoutCart.guestEmail = ''
    }
  }
}, { immediate: true })

watch(() => guestState.country, () => {
  if (isAuthenticated.value) {
    return
  }

  guestState.state = ''
  guestState.zip = ''

  if (guestState.country) {
    refetchGetStatesByCountry()
  }
})

watch(guestState, () => {
  if (isAuthenticated.value) {
    return
  }

  const parsed = guestCheckoutFormSchema.safeParse(guestState)
  if (parsed.success) {
    cartStore.stateCheckoutCart.address = {
      full_name: parsed.data.full_name,
      address_1: parsed.data.address_1,
      address_2: parsed.data.address_2,
      city: parsed.data.city,
      country: parsed.data.country,
      state: parsed.data.state,
      zip: parsed.data.zip,
      phone: parsed.data.phone,
    }
    cartStore.stateCheckoutCart.guestEmail = parsed.data.email
  }
  else {
    cartStore.stateCheckoutCart.address = null
    cartStore.stateCheckoutCart.guestEmail = guestState.email
  }
}, { deep: true, immediate: true })

const showCreateDialog = () => {
  dialog.open(CreateUserAddressDialog)
}
</script>

<template>
  <UCard>
    <div v-if="isAuthenticated">
      <div class="mb-2 flex items-center justify-between">
        <legend class="mb-1 text-base font-bold text-gray-700">
          Shipping Address
        </legend>
        <UButton
          color="primary"
          variant="solid"
          :disabled="isPendingGetUserAddresses"
          @click="showCreateDialog"
        >
          Add a new address
        </UButton>
      </div>

      <div
        v-if="isPendingGetUserAddresses"
        class="grid h-80 w-full place-content-center"
      >
        <LoadingSvg :child-class="'!w-10 !h-10'" />
      </div>
      <div
        v-else-if="addressRadioOptions"
        class="mt-8 gap-x-56 gap-y-16"
      >
        <RadioGroupInput
          v-model="addressIdSelected"
          :options="addressRadioOptions"
          value-attribute="id"
        >
          <template #label="{ option }">
            <div class="mb-6 flex w-full flex-col gap-1 text-customGray-950">
              <div class="text-sm font-medium text-gray-700">
                {{ option.full_name }} |
                <span class="font-normal">{{ option.phone }}</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ option.address_1 }}, {{ option.city }}, {{ option.zip }}, {{ option.country }}
              </div>
            </div>
          </template>
        </RadioGroupInput>
      </div>
    </div>

    <div v-else>
      <div class="mb-6 space-y-1">
        <legend class="text-base font-bold text-gray-700">
          Contact & Shipping
        </legend>
        <p class="text-sm text-gray-500">
          Enter your email and shipping address to check out as a guest.
        </p>
      </div>

      <div class="space-y-4">
        <UFormGroup
          required
          label="Email"
          name="email"
        >
          <UInput
            v-model="guestState.email"
            size="lg"
            maxlength="320"
            type="email"
          />
        </UFormGroup>
        <UFormGroup
          required
          label="Full Name"
          name="full_name"
        >
          <UInput
            v-model="guestState.full_name"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_FULL_NAME"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          required
          label="Street"
          name="address_1"
        >
          <UInput
            v-model="guestState.address_1"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_ADDRESS"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          label="Apt / Suite / Other"
          name="address_2"
        >
          <UInput
            v-model="guestState.address_2"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_ADDRESS"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          required
          label="City"
          name="city"
        >
          <UInput
            v-model="guestState.city"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_CITY"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          required
          label="Country"
          name="country"
        >
          <USelectMenu
            v-model="guestState.country"
            searchable
            :loading="isPendingGetCountries"
            :options="countriesOptions"
            size="lg"
          />
        </UFormGroup>
        <div class="flex gap-3">
          <UFormGroup
            required
            label="State/Province"
            name="state"
            class="w-1/2"
          >
            <USelectMenu
              v-model="guestState.state"
              searchable
              :loading="isFetchingGetStates"
              :disabled="!guestState.country || isFetchingGetStates"
              :options="stateOptions"
              size="lg"
            />
          </UFormGroup>
          <UFormGroup
            required
            label="Zip/Postal code"
            name="zip"
            class="w-1/2"
          >
            <UInput
              v-model="guestState.zip"
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
        >
          <UInput
            v-model="guestState.phone"
            v-numeric
            size="lg"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_PHONE"
            type="phone"
          />
        </UFormGroup>
      </div>
    </div>
  </UCard>
</template>
