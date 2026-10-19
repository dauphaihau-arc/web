<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { saveShopFinancePayoutAccountRequestSchema } from '@arc/schemas/api/shop/finance/payout-account.schema'
import type {
  SaveShopFinancePayoutAccountRequestBody,
  ShopFinancePayoutAccount,
} from '~/domains/shop/api/finance/contracts/payout-account.contract'
import { PAYOUT_ACCOUNT_ERROR_MESSAGES } from '~/domains/shop/api/finance/payout-account-error-messages'
import { useSaveShopFinancePayoutAccount } from '~/domains/shop/queries/payout-account.query'
import { useShopFinancePayable } from '~/domains/shop/queries/finance-payable.query'
import { useGetCountries } from '~/domains/location/queries/countries.query'
import { readApiError } from '~/shared/lib/api-error'
import { toastCustom } from '~/shared/config/toast'

const props = defineProps<{
  /** The shop's current Payout Account, when one is being replaced. */
  account?: ShopFinancePayoutAccount | null
}>()

const modal = useModal()
const toast = useToast()
const { data: payable } = useShopFinancePayable()
const { data: countriesResponse } = useGetCountries()
const { mutateAsync: savePayoutAccount, isPending } = useSaveShopFinancePayoutAccount()

const payoutAccountTypeOptions: Array<{
  label: string
  value: SaveShopFinancePayoutAccountRequestBody['type']
}> = [
  { label: 'Bank account', value: 'bank' },
  { label: 'Wallet', value: 'wallet' },
]

const countryOptions = computed(() => (countriesResponse.value?.data ?? [])
  .filter(country => country.Iso2)
  .map(country => ({ label: country.name, value: country.Iso2! })))

/**
 * The stored account identifies itself by the holder, bank and country it was
 * saved with, so those are prefilled. The reference is never returned and must
 * be re-entered: replacing closes the stored row and activates the new one.
 */
const state = reactive<SaveShopFinancePayoutAccountRequestBody>({
  type: props.account?.type ?? 'bank',
  holder_name: props.account?.holder_name ?? '',
  bank_name: props.account?.bank_name ?? '',
  country: props.account?.country ?? '',
  account_reference: '',
})
const serverError = ref('')
const formRef = ref()
const currency = computed(() => payable.value?.currency ?? '')
const isReplacing = computed(() => Boolean(props.account))
const dialogTitle = computed(() => (isReplacing.value ? 'Replace bank account' : 'Add bank account'))
const dialogDescription = computed(() => (isReplacing.value
  ? 'Saving replaces the account you are paid into. The stored reference is never shown, so re-enter it.'
  : 'Payouts go to this Payout Account. Only its last four characters are shown after saving.'))

const actions = computed(() => [
  {
    id: 'cancel',
    label: 'Cancel',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: isPending.value,
    run: () => modal.close(),
  },
  {
    id: 'save',
    label: isReplacing.value ? 'Replace bank account' : 'Save bank account',
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    loading: isPending.value,
    run: () => formRef.value?.submit(),
  },
])

async function submit(event: FormSubmitEvent<SaveShopFinancePayoutAccountRequestBody>) {
  serverError.value = ''

  try {
    await savePayoutAccount(event.data)
    toast.add({
      ...toastCustom.success,
      title: isReplacing.value ? 'Payout account replaced' : 'Payout account saved',
    })
    await modal.close()
  }
  catch (error) {
    const apiError = readApiError(error)
    serverError.value = (apiError.code ? PAYOUT_ACCOUNT_ERROR_MESSAGES[apiError.code] : undefined)
      ?? apiError.message
      ?? 'Unable to save the Payout Account.'
  }
}
</script>

<template>
  <BaseDialog
    :title="dialogTitle"
    :description="dialogDescription"
    :actions="actions"
  >
    <div class="space-y-5">
      <UAlert
        v-if="serverError"
        color="red"
        variant="subtle"
        title="Unable to save"
        :description="serverError"
      />

      <UForm
        ref="formRef"
        :validate-on="['submit']"
        :state="state"
        :schema="saveShopFinancePayoutAccountRequestSchema"
        class="space-y-5"
        @submit="submit"
      >
        <UFormGroup
          label="Type"
          name="type"
          required
        >
          <USelectMenu
            v-model="state.type"
            :options="payoutAccountTypeOptions"
            value-attribute="value"
            option-attribute="label"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup
          label="Account holder name"
          name="holder_name"
          required
        >
          <UInput
            v-model.trim="state.holder_name"
            :maxlength="255"
            size="lg"
            autocomplete="name"
          />
        </UFormGroup>

        <UFormGroup
          label="Bank name"
          name="bank_name"
          required
        >
          <UInput
            v-model.trim="state.bank_name"
            :maxlength="255"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup
          label="Country"
          name="country"
          required
        >
          <USelectMenu
            v-model="state.country"
            searchable
            clear-search-on-close
            :options="countryOptions"
            value-attribute="value"
            option-attribute="label"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup
          label="Account reference"
          name="account_reference"
          required
          description="Use 4–34 letters, digits or dashes. The stored reference is never shown, so enter it in full."
        >
          <UInput
            v-model="state.account_reference"
            :maxlength="34"
            size="lg"
            autocomplete="off"
          />
        </UFormGroup>

        <UFormGroup label="Settlement Currency">
          <UInput
            :model-value="currency"
            disabled
            size="lg"
          />
        </UFormGroup>
      </UForm>
    </div>
  </BaseDialog>
</template>
