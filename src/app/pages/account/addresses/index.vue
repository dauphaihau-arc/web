<script lang="ts" setup>
import type { GetUserAddressesResponse } from '~/shared/api/me/address/contracts/address.contract'
import { useDeleteUserAddress } from '~/shared/server-state/me/address/delete-address.mutation'
import { useGetUserAddresses } from '~/shared/server-state/me/address/addresses.query'
import UpdateUserAddressDialog from '~/app/components/dialogs/update-user-address-dialog.vue'
import CreateUserAddressDialog from '~/app/components/dialogs/create-user-address-dialog.vue'
import LoadingSvg from '~/shared/ui/loading-svg.vue'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const dialog = useModal()

const {
  isPending: isPendingGetUserAddresses,
  data: dataUserAddress,
  refetch,
} = useGetUserAddresses()

const {
  isPending: isPendingDeleteUserAddresses,
  mutate: deleteUserAddress,
} = useDeleteUserAddress({
  onSuccess() {
    refetch()
  },
})

type UserAddress = GetUserAddressesResponse['results'][number]

const showUpdateDialog = (item: UserAddress) => {
  dialog.open(UpdateUserAddressDialog, {
    dataEdit: item,
  })
}

const showCreateDialog = () => {
  dialog.open(CreateUserAddressDialog)
}
</script>

<template>
  <div class="w-full">
    <h3 class="mb-4 text-2xl font-medium">
      Your shipping addresses
    </h3>
    <UButton
      color="primary"
      variant="solid"
      @click="showCreateDialog"
    >
      Add a new address
    </UButton>

    <div
      v-if="isPendingGetUserAddresses"
      class="grid h-[50vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div
      v-else-if="dataUserAddress?.results && dataUserAddress.results.length > 0"
      class="mt-8 grid grid-cols-3 gap-x-56 gap-y-16"
    >
      <div
        v-for="item in dataUserAddress.results"
        :key="item.id"
      >
        <div class="flex min-w-56 flex-col gap-3">
          <div class="">
            {{ item.full_name }}
          </div>
          <div class="">
            {{ item.address_1 }}
          </div>
          <div class="flex gap-2">
            <div>{{ item.city }}</div>
            <div>{{ item.zip }}</div>
          </div>
          <div class="">
            {{ item.country }}
          </div>
          <div class="mt-4 flex items-center gap-3">
            <UButton
              :padded="false"
              variant="link"
              @click="showUpdateDialog(item)"
            >
              Edit
            </UButton>
            <UButton
              :padded="false"
              variant="link"
              :disabled="isPendingDeleteUserAddresses"
              @click="deleteUserAddress(item.id)"
            >
              Delete
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
