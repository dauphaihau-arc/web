<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { z } from 'zod'
import { MarketCurrencies } from '@arc/enums/market'
import { formatMinorCurrency, fromMinorUnits, toMinorUnits } from '@arc/utils'
import { MANUAL_PAYOUT_ERROR_MESSAGES } from '~/domains/shop/api/finance/payout-error-messages'
import type { ShopFinancePayout } from '~/domains/shop/api/finance/contracts/payout.contract'
import { useRequestShopFinanceManualPayout } from '~/domains/shop/mutations/request-manual-payout.mutation'
import { readApiError } from '~/shared/lib/api-error'
import { toastCustom } from '~/shared/config/toast'
import { useManualPayoutQuote } from './use-manual-payout-quote'

const props = defineProps<{
  /** The whole net available balance, in integer minor units. */
  availableMinor: number
  /** The currency the balance is held in. */
  currency: string
  /** The currency the payout account settles in. */
  targetCurrency: string
}>()

const modal = useModal()
const toast = useToast()
const { mutateAsync: requestPayout, isPending } = useRequestShopFinanceManualPayout()

/** Currencies whose smallest unit is the whole unit, so no decimals are typed. */
const ZERO_DECIMAL_CURRENCIES: string[] = [
  MarketCurrencies.JPY,
  MarketCurrencies.KRW,
  MarketCurrencies.VND,
]
const decimalPlaces = computed(() => (
  ZERO_DECIMAL_CURRENCIES.includes(props.currency) ? 0 : 2
))
const minorUnitScale = computed(() => 10 ** decimalPlaces.value)
const availableMajor = computed(() => fromMinorUnits(props.availableMinor, props.currency))
const availableLabel = computed(() => formatMinorCurrency(props.availableMinor, props.currency))

/**
 * The seller types money, not minor units. The amount is prefilled with the
 * whole available balance, which the API treats as "withdraw everything".
 */
const state = reactive<{ amount: string }>({
  amount: availableMajor.value.toFixed(decimalPlaces.value),
})
const serverError = ref('')
const formRef = ref()

/**
 * The amount is typed, so the field keeps only what can be money: digits and a
 * single decimal separator. Anything else is dropped as it is typed or pasted,
 * and the fraction is cut to the currency's decimal places.
 */
function sanitizeAmount(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const [whole = '', ...fractionParts] = cleaned.split('.')
  const fraction = fractionParts.join('').slice(0, decimalPlaces.value)

  if (fractionParts.length === 0 || decimalPlaces.value === 0) {
    return whole
  }

  return `${whole}.${fraction}`
}

/**
 * The element is written back as well, so text that sanitizes to the amount
 * already in state still leaves the field instead of lingering in the DOM.
 */
function onAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const amount = sanitizeAmount(input.value)

  input.value = amount
  state.amount = amount
}

watch(() => state.amount, (value) => {
  if (value === '' || value === '.') {
    return
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
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

const {
  showQuotePanel,
  isQuoteFetching,
  quoteErrorText,
  quotedPaidLabel,
  quotedRateLabel,
  quotedReceivedLabel,
} = useManualPayoutQuote({
  amountMinor,
  canPreview: canWithdraw,
  sourceCurrency: () => props.currency,
  targetCurrency: () => props.targetCurrency,
})

/**
 * The one-line confirmation for the withdrawal the API accepted. A converted
 * payout also names what the provider should land in the payout account; until
 * it reports a target amount, the paid amount stands in.
 */
function withdrawalMessage(payout: ShopFinancePayout) {
  const paid = formatMinorCurrency(payout.amount_minor, payout.currency)
  const isConversion = Boolean(payout.target_currency)
    && payout.target_currency !== payout.currency

  if (!isConversion) {
    return `Withdrawal requested — ${paid} paid out.`
  }

  const received = payout.target_amount_minor == null
    ? paid
    : formatMinorCurrency(
        payout.target_amount_minor,
        payout.target_currency ?? payout.currency,
      )

  return `Withdrawal requested — ${paid} → ${received}.`
}

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
    const response = await requestPayout(
      amount === props.availableMinor
        ? {}
        : { amount_minor: amount },
    )

    modal.close()
    toast.add({
      ...toastCustom.success,
      title: withdrawalMessage(response.payout),
    })
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
          :description="`Your available balance is ${availableLabel}.`"
        >
          <UInput
            :model-value="state.amount"
            type="text"
            inputmode="decimal"
            size="lg"
            class="w-56"
            autocomplete="off"
            @input="onAmountInput"
          >
            <template #trailing>
              {{ currency }}
            </template>
          </UInput>
        </UFormGroup>

        <div
          v-if="showQuotePanel"
          class="min-h-44 rounded-md border border-border-subtle bg-surface-subtle p-4 text-sm"
          data-testid="payout-quote"
        >
          <div
            class="transition-opacity duration-200"
            :class="{ 'opacity-60': isQuoteFetching }"
            data-testid="payout-quote-body"
            :aria-busy="isQuoteFetching"
          >
            <dl class="space-y-2">
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-text-muted">
                  Paid out
                </dt>
                <dd class="tabular-nums text-text-strong">
                  {{ quotedPaidLabel }}
                </dd>
              </div>
              <div
                class="flex items-baseline justify-between gap-4"
                data-testid="payout-quote-rate"
              >
                <dt class="text-text-muted">
                  Rate
                </dt>
                <dd class="tabular-nums text-text-strong">
                  {{ quotedRateLabel }}
                </dd>
              </div>
              <div
                class="flex items-baseline justify-between gap-4 border-t border-border-subtle pt-2"
                data-testid="payout-quote-received"
              >
                <dt class="font-medium text-text-strong">
                  You receive
                </dt>
                <dd class="font-semibold tabular-nums text-text-strong">
                  {{ quotedReceivedLabel }}
                </dd>
              </div>
            </dl>
            <p
              class="mt-3 border-t border-border-subtle pt-3 text-xs text-text-muted"
              data-testid="payout-quote-estimate"
            >
              Estimated — the final amount is set when Stripe sends the transfer.
            </p>
          </div>
        </div>

        <UAlert
          v-if="quoteErrorText"
          color="red"
          variant="subtle"
          title="Unable to preview this payout"
          :description="quoteErrorText"
        />
      </UForm>
    </div>
  </BaseDialog>
</template>
