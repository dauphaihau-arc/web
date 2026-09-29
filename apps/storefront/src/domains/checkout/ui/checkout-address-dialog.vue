<script setup lang="ts">
import AddressForm from '~/domains/me/ui/address/address-form.vue'
import type { AddressFormState } from '~/domains/me/ui/address/address-form.types'
import type { CreateUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract'
import type { StateCheckoutCart, StateCheckoutNow } from '~/domains/cart/stores/cart.store.types'
import { guestCheckoutFormSchema } from '@arc/schemas/guest-checkout.schema'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetUserAddresses } from '~/domains/me/queries/address/addresses.query'
import { useCreateUserAddress } from '~/domains/me/mutations/address/create-address.mutation'
import { toastCustom } from '~/shared/config/toast'

const checkoutState = defineModel<StateCheckoutCart | StateCheckoutNow>('checkoutState', { required: true })

const dialog = useModal()
const toast = useToast()
const queryClient = useQueryClient()

const formRef = ref()

/**
 * A guest address has no `id`; it is the buyer's own entry, so the form opens
 * prefilled for editing. A saved user address keeps the form empty because it
 * only ever backs the "Add new address" view.
 */
function getInitialFormState(): AddressFormState {
  const current = checkoutState.value.address

  if (!current || 'id' in current) {
    return {}
  }

  return {
    ...current,
    email: checkoutState.value.guestEmail,
  }
}

const formState = reactive<AddressFormState>(getInitialFormState())

/**
 * Authenticated buyers can pick a saved address or add one; guests have no
 * saved list, so they land straight on the address form.
 */
const view = ref<'list' | 'form'>('list')

const { data: dataUserAuth } = useGetCurrentUser()
const isAuthenticated = computed(() => !!dataUserAuth.value?.user)
const activeView = computed(() => isAuthenticated.value ? view.value : 'form')

const {
  isPending: isPendingGetUserAddresses,
  data: dataUserAddress,
} = useGetUserAddresses()

const { mutateAsync: createUserAddress } = useCreateUserAddress()

const addressOptions = computed(() => dataUserAddress.value?.results ?? [])

const addressIdSelected = ref<string>(
  checkoutState.value.address && 'id' in checkoutState.value.address
    ? checkoutState.value.address.id
    : '',
)

const dialogTitle = computed(() => {
  if (activeView.value === 'form' && isAuthenticated.value) {
    return 'Add new address'
  }
  return 'Shipping address'
})

function selectAddress(id: string | number | boolean) {
  const selected = addressOptions.value.find(item => item.id === id)

  if (!selected) {
    return
  }

  checkoutState.value.address = selected
  checkoutState.value.guestEmail = ''
  void dialog.close()
}

async function onSubmitUserAddress(payload: AddressFormState) {
  try {
    const { address } = await createUserAddress(payload as CreateUserAddressRequest)

    checkoutState.value.address = address
    checkoutState.value.guestEmail = ''
    await queryClient.invalidateQueries({
      queryKey: ['get-user-addresses'],
    })
    await dialog.close()
  }
  catch {
    toast.add({
      ...toastCustom.error,
      title: 'Create address failed',
    })
  }
}

function onSubmitGuestAddress(payload: AddressFormState) {
  const parsed = guestCheckoutFormSchema.safeParse(payload)

  if (!parsed.success) {
    return
  }

  const { email, ...address } = parsed.data

  checkoutState.value.address = address
  checkoutState.value.guestEmail = email
  void dialog.close()
}
</script>

<template>
  <BaseDialog
    :ui="{
      modal: {
        inner: '-top-10',
      },
    }"
    :title="dialogTitle"
  >
    <div v-if="activeView === 'list'">
      <div
        v-if="isPendingGetUserAddresses"
        class="grid h-60 w-full place-content-center"
      >
        <LoadingSvg :child-class="'!w-10 !h-10'" />
      </div>

      <RadioGroupInput
        v-else-if="addressOptions.length"
        v-model="addressIdSelected"
        direction="vertical"
        gap
        :options="addressOptions"
        value-attribute="id"
        @update:model-value="selectAddress"
      >
        <template #label="{ option }">
          <div @click="selectAddress(option.id)">
            <div class="text-sm font-medium text-text-subtle">
              {{ option.full_name }} |
              <span class="font-normal">{{ option.phone }}</span>
            </div>
            <div class="text-sm text-text-muted">
              {{ option.address_1 }}, {{ option.city }}, {{ option.zip }}, {{ option.country }}
            </div>
          </div>
        </template>
      </RadioGroupInput>

      <p
        v-else
        class="text-sm text-text-muted"
      >
        You have no saved addresses yet.
      </p>
    </div>

    <AddressForm
      v-else
      ref="formRef"
      v-model:state="formState"
      :guest="!isAuthenticated"
      @submit="isAuthenticated ? onSubmitUserAddress($event) : onSubmitGuestAddress($event)"
    />

    <template #footer>
      <DialogActions>
        <UButton
          v-if="activeView === 'list'"
          size="md"
          @click="view = 'form'"
        >
          Add new address
        </UButton>

        <template v-else-if="isAuthenticated">
          <UButton
            size="md"
            color="gray"
            @click="view = 'list'"
          >
            Back
          </UButton>
          <UButton
            size="md"
            type="submit"
            @click="formRef?.submit"
          >
            Save
          </UButton>
        </template>

        <UButton
          v-else
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
