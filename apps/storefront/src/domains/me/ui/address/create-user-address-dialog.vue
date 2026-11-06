<script setup lang="ts">
import AddressForm from '~/domains/me/ui/address/address-form.vue'
import type { AddressFormState } from '~/domains/me/ui/address/address-form.types'
import { toSavedAddressRequest } from '~/domains/me/ui/address/address-payload'
import { toastCustom } from '~/shared/config/toast'
import { useCreateUserAddress } from '~/domains/me/mutations/address/create-address.mutation'

const toast = useToast()
const dialog = useModal()
const queryClient = useQueryClient()

const formRef = ref()

const stateSubmit = reactive<AddressFormState>({})

const {
  mutateAsync: createUserAddress,
  isPending: isPendingCreateAddress,
} = useCreateUserAddress()

async function onSubmit(payload: AddressFormState) {
  try {
    await createUserAddress(toSavedAddressRequest(payload))
    await dialog.close()
    await queryClient.invalidateQueries({
      queryKey: ['get-user-addresses'],
    })
  }
  catch {
    toast.add({
      ...toastCustom.error,
      title: 'Create address failed',
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
    title="Add new address"
  >
    <AddressForm
      ref="formRef"
      v-model:state="stateSubmit"
      @submit="onSubmit"
    />

    <template #footer>
      <DialogActions>
        <UButton
          size="md"
          color="gray"
          :disabled="isPendingCreateAddress"
          @click="dialog.close"
        >
          Cancel
        </UButton>
        <UButton
          size="md"
          type="submit"
          :loading="isPendingCreateAddress"
          @click="formRef?.submit"
        >
          Save
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
