<script setup lang="ts">
import { useGetUserAddresses } from '~/shared/services/user'
import CreateUserAddressDialog from '~/modules/dialogs/create-user-address-dialog.vue'

const cartStore = useCartStore()
const dialog = useModal()

const {
  isPending: isPendingGetUserAddresses,
  data: dataUserAddress,
} = useGetUserAddresses()

const addressRadioOptions = computed(() => {
  if (dataUserAddress.value?.results && dataUserAddress.value.results.length > 0) {
    return dataUserAddress.value.results
  }
  return null
})

const addressIdSelected = ref()

watch(addressRadioOptions, () => {
  if (addressRadioOptions.value && !cartStore.stateCheckoutCart.address) {
    addressIdSelected.value = addressRadioOptions.value[0].id
  }
}, { immediate: true })

watch(() => addressIdSelected.value, () => {
  if (dataUserAddress.value) {
    const address = dataUserAddress.value.results.find((item) => {
      return item.id === addressIdSelected.value
    })
    if (address) {
      cartStore.stateCheckoutCart.address = address
    }
  }
}, { immediate: true })

const showCreateDialog = () => {
  dialog.open(CreateUserAddressDialog)
}
</script>

<template>
  <UCard>
    <div>
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
                {{ option.address1 }}, {{ option.city }}, {{ option.zip }}, {{ option.country }}
              </div>
            </div>
          </template>
        </RadioGroupInput>
      </div>
    </div>
  </UCard>
</template>
