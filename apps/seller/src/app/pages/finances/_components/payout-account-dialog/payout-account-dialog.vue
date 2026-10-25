<script setup lang="ts">
import { startShopFinancePayoutAccountOnboardingRequestSchema } from '@arc/schemas/api/shop/finance/payout-account.schema'
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract'
import { usePayoutAccountDialog } from './use-payout-account-dialog'

const props = defineProps<{
  /** The shop's current Payout Account, when one exists already. */
  account?: ShopFinancePayoutAccount | null
}>()

const {
  isBusy,
  countryOptions,
  knownCountry,
  countryName,
  state,
  serverError,
  canSubmit,
  closeDialog,
  submit,
} = usePayoutAccountDialog({ account: () => props.account })

const formRef = ref()

const dialogTitle = 'Set up payouts with Stripe'
const dialogDescription = 'We\'ll take you to Stripe to add your details and bank account. Payouts are sent straight to that account.'

const actions = computed(() => [
  {
    id: 'cancel',
    label: 'Cancel',
    variant: 'secondary' as const,
    allowWhileInputFocused: true,
    disabled: isBusy.value,
    run: closeDialog,
  },
  {
    id: 'continue',
    label: 'Continue to Stripe',
    allowWhileInputFocused: true,
    disabled: !canSubmit.value || isBusy.value,
    loading: isBusy.value,
    run: () => formRef.value?.submit(),
  },
])
</script>

<template>
  <BaseDialog
    :title="dialogTitle"
    :description="dialogDescription"
    :actions="actions"
    width="w-full sm:max-w-md"
    body-class="space-y-5 p-8"
    card-class="overflow-visible rounded-dialog border border-border-subtle bg-surface text-text-strong"
    :ui="{
      modal: { margin: '!mb-72' },
      card: { body: { base: 'flex min-h-0 flex-1 flex-col overflow-visible' } },
    }"
  >
    <div class="space-y-5">
      <UAlert
        v-if="serverError"
        color="red"
        variant="subtle"
        title="Unable to start setup"
        :description="serverError"
      />

      <UForm
        ref="formRef"
        :validate-on="['submit']"
        :state="state"
        :schema="startShopFinancePayoutAccountOnboardingRequestSchema"
        class="space-y-5"
        @submit="submit"
      >
        <UFormGroup
          v-if="!knownCountry"
          label="Country where you'll receive payouts"
          name="country"
          required
          description="Use the country where your bank account is held."
        >
          <USelectMenu
            v-model="state.country"
            data-testid="payout-account-country"
            :disabled="isBusy"
            :options="countryOptions"
            :ui-menu="{ container: 'z-[60]' }"
            searchable
            clear-search-on-close
            value-attribute="value"
            option-attribute="label"
            size="lg"
          />
        </UFormGroup>

        <p
          v-else
          class="rounded-md bg-surface-subtle p-3 text-sm text-text-muted"
        >
          Your account is registered in {{ countryName }}. Continue to Stripe to
          finish the remaining details.
        </p>
      </UForm>
    </div>
  </BaseDialog>
</template>
