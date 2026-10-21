<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { z } from 'zod'
import { formatMinorCurrency, fromMinorUnits, toMinorUnits } from '@arc/utils'
import { MANUAL_PAYOUT_ERROR_MESSAGES } from '~/domains/shop/api/finance/payout-error-messages'
import { useRequestShopFinanceManualPayout } from '~/domains/shop/mutations/request-manual-payout.mutation'
import { readApiError } from '~/shared/lib/api-error'

const props = defineProps<{
  /** The whole net available balance, in integer minor units. */
  availableMinor: number
  currency: string
}>()

const modal = useModal()
const { mutateAsync: requestPayout, isPending } = useRequestShopFinanceManualPayout()

const minorUnitScale = computed(() => Math.round(1 / fromMinorUnits(1, props.currency)))
const decimalPlaces = computed(() => Math.round(Math.log10(minorUnitScale.value)))
const availableMajor = computed(() => fromMinorUnits(props.availableMinor, props.currency))
const availableLabel = computed(() => formatMinorCurrency(props.availableMinor, props.currency))
const decimalStep = computed(() => (decimalPlaces.value === 0 ? '1' : '0.01'))

/**
 * The seller types money, not minor units. The amount is prefilled with the
 * whole available balance, which the API treats as "withdraw everything".
 */
const state = reactive<{ amount: string }>({
  amount: availableMajor.value.toFixed(decimalPlaces.value),
})
const serverError = ref('')
const formRef = ref()

watch(() => state.amount, (value) => {
  if (value === '' || value === '-' || value === '.') {
    return
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return
  }

  if (amount < 0) {
    state.amount = '0'
    return
  }

  if (amount > availableMajor.value) {
    state.amount = availableMajor.value.toFixed(decimalPlaces.value)
  }
})

const schema = computed(() => z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount greater than 0.' })
    .positive('Enter an amount greater than 0.')
    .max(
      availableMajor.value,
      `That is more than your available balance of ${availableLabel.value}.`,
    )
    .refine(
      amount => Math.abs(
        amount * minorUnitScale.value - Math.round(amount * minorUnitScale.value),
      ) < 1e-9,
      `Use at most ${decimalPlaces.value} decimal places for ${props.currency}.`,
    ),
}))

const amountMinor = computed(() => toMinorUnits(Number(state.amount), props.currency))
const isWithdrawingAll = computed(() => amountMinor.value === props.availableMinor)
const canWithdraw = computed(() => {
  const amount = Number(state.amount)

  return String(state.amount).trim() !== ''
    && Number.isFinite(amount)
    && amount > 0
    && amount <= availableMajor.value
})

const actions = computed(() => [
  {
    id: 'cancel',
    label: 'Cancel',
    variant: 'secondary' as const,
    allowWhileInputFocused: true,
    disabled: isPending.value,
    run: () => modal.close(),
  },
  {
    id: 'withdraw',
    label: isWithdrawingAll.value ? 'Withdraw all' : 'Withdraw',
    allowWhileInputFocused: true,
    disabled: !canWithdraw.value,
    loading: isPending.value,
    run: () => formRef.value?.submit(),
  },
])

async function submit(event: FormSubmitEvent<{ amount: string }>) {
  serverError.value = ''
  const amount = toMinorUnits(Number(event.data.amount), props.currency)

  try {
    await requestPayout(
      amount === props.availableMinor
        ? {}
        : { amount_minor: amount },
    )
    await modal.close()
  }
  catch (error) {
    const apiError = readApiError(error)
    serverError.value = (apiError.code ? MANUAL_PAYOUT_ERROR_MESSAGES[apiError.code] : undefined)
      ?? apiError.message
      ?? 'Unable to request the withdrawal.'
  }
}
</script>

<template>
  <BaseDialog
    title="Withdraw now"
    description="Take money out of your available balance."
    width="w-full sm:max-w-md"
    body-class="min-h-0 flex-1 overflow-y-auto px-6 py-6"
    :actions="actions"
  >
    <div class="space-y-5">
      <UAlert
        v-if="serverError"
        color="red"
        variant="subtle"
        title="Unable to withdraw"
        :description="serverError"
      />

      <UForm
        ref="formRef"
        :validate-on="['submit']"
        :state="state"
        :schema="schema"
        class="w-full space-y-5"
        @submit="submit"
      >
        <UFormGroup
          label="Amount"
          name="amount"
          required
          class="w-full"
          :description="`Your available balance is ${availableLabel}. Leave the amount as it is to withdraw everything.`"
        >
          <UInput
            v-model.trim="state.amount"
            type="number"
            inputmode="decimal"
            min="0"
            :step="decimalStep"
            size="lg"
            class="w-56"
            autocomplete="off"
          >
            <template #trailing>
              {{ currency }}
            </template>
          </UInput>
        </UFormGroup>
      </UForm>
    </div>
  </BaseDialog>
</template>
