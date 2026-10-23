<script setup lang="ts">
import { currencyOptions } from '@arc/utils'
import type {
  ShopFinanceSettlementCurrencyBlockedReason,
  ShopFinanceSettlementCurrencyChange,
} from '~/domains/shop/api/finance/contracts/settlement-currency.contract'
import {
  SETTLEMENT_CURRENCY_ERROR_MESSAGES,
  formatSettlementCurrencyDate,
  settlementCurrencyBlockedReasonMessage,
  settlementCurrencyNextChangeMessage,
} from '~/domains/shop/api/finance/settlement-currency-error-messages'
import { useShopFinanceSettlementCurrency } from '~/domains/shop/queries/settlement-currency.query'
import { useChangeShopFinanceSettlementCurrency } from '~/domains/shop/mutations/change-settlement-currency.mutation'
import { readApiError } from '~/shared/lib/api-error'
import { toastCustom } from '~/shared/config/toast'

const props = defineProps<{
  /** The shop's currency today. */
  currency: string
  /** When a second change becomes allowed, or null before the first one. */
  nextChangeAllowedAt?: string | null
  /** The eligibility the row last saw; refreshed below when the dialog opens. */
  canChange: boolean
  /** Why the server refuses the change, or null when it is allowed. */
  blockedReason?: ShopFinanceSettlementCurrencyBlockedReason | null
}>()

const modal = useModal()
const toast = useToast()
const { data: eligibility, refetch: refetchEligibility } = useShopFinanceSettlementCurrency()
const { mutateAsync: changeCurrency, isPending } = useChangeShopFinanceSettlementCurrency()

/**
 * The balance can move while the page is open, so re-read the gate when the
 * dialog opens. This updates the shared cache, so the row behind it follows.
 */
onMounted(() => {
  refetchEligibility()
})

const currentCanChange = computed(() => eligibility.value?.can_change ?? props.canChange)
const currentBlockedReason = computed(() => eligibility.value?.blocked_reason ?? props.blockedReason)
const currentNextChangeAllowedAt = computed(
  () => eligibility.value?.next_change_allowed_at ?? props.nextChangeAllowedAt,
)

const state = reactive<{ currency: string }>({ currency: props.currency })
const serverError = ref('')
const result = ref<ShopFinanceSettlementCurrencyChange | null>(null)

const options = computed(() => currencyOptions.map(option => ({
  label: option.label,
  value: option.id,
})))

const nextChangeMessage = computed(() => settlementCurrencyNextChangeMessage(currentNextChangeAllowedAt.value))

const effectiveFromLabel = computed(() => (
  result.value ? formatSettlementCurrencyDate(result.value.effective_from) : null
))

const blockedMessage = computed(() => settlementCurrencyBlockedReasonMessage(
  currentBlockedReason.value,
  currentNextChangeAllowedAt.value,
))

const hasDifferentCurrency = computed(() => state.currency !== props.currency)

const canSubmit = computed(() => currentCanChange.value && hasDifferentCurrency.value)

const actions = computed(() => {
  if (result.value) {
    return [
      {
        id: 'done',
        label: 'Done',
        variant: 'secondary' as const,
        shortcut: 'escape' as const,
        run: () => modal.close(),
      },
    ]
  }

  return [
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
      id: 'change',
      label: 'Change shop currency',
      allowWhileInputFocused: true,
      disabled: !canSubmit.value,
      loading: isPending.value,
      run: () => submit(),
    },
  ]
})

async function submit() {
  if (!canSubmit.value) {
    return
  }

  serverError.value = ''

  try {
    result.value = await changeCurrency({ currency: state.currency })
    toast.add({
      ...toastCustom.success,
      title: `Shop currency changed to ${result.value.currency}`,
    })
  }
  catch (error) {
    const apiError = readApiError(error)
    serverError.value = (apiError.code ? SETTLEMENT_CURRENCY_ERROR_MESSAGES[apiError.code] : undefined)
      ?? apiError.message
      ?? 'Unable to change the shop currency.'
  }
}
</script>

<template>
  <BaseDialog
    :title="result ? 'Shop currency changed' : 'Change shop currency'"
    :description="result
      ? `Set up a payout account in ${result.currency} before payouts can resume.`
      : 'Your shop moves to another currency immediately. It can only happen at a zero balance.'"
    :actions="actions"
    body-class="space-y-5 p-8"
    card-class="overflow-visible rounded-dialog border border-border-subtle bg-surface text-text-strong"
    :ui="{
      modal: { margin: '!mb-72' },
      card: { body: { base: 'flex min-h-0 flex-1 flex-col overflow-visible' } },
    }"
  >
    <div
      v-if="result"
      class="space-y-5"
    >
      <UAlert
        color="green"
        variant="subtle"
        icon="i-heroicons-check-circle"
        :title="`Your shop now uses ${result.currency}.`"
      />

      <div class="space-y-3 text-sm text-text-muted">
        <p>
          Orders placed before {{ effectiveFromLabel }} keep their original
          currency, including their refunds.
        </p>
      </div>

      <UButton
        to="/finances"
        icon="i-heroicons-banknotes"
        @click="modal.close()"
      >
        Add payout account
      </UButton>
    </div>

    <div
      v-else
      class="space-y-5"
    >
      <UAlert
        v-if="serverError"
        color="red"
        variant="subtle"
        title="Unable to change shop currency"
        :description="serverError"
      />

      <UAlert
        v-if="blockedMessage && !serverError"
        data-testid="settlement-currency-blocked-reason"
        color="amber"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        :description="blockedMessage"
      />

      <div class="space-y-3 text-sm text-text-muted">
        <p>
          Existing payouts stay exactly as they are.
        </p>
        <p>
          Auto payout will be turned off. A payout account works in one currency,
          so your current {{ currency }} account can no longer be used; add and
          verify an account in the new currency to turn payouts back on.
        </p>
        <p>
          Product prices and promotions are not changed. They keep the currency
          they were set in, so re-price them explicitly if you want them in the
          new currency.
        </p>
      </div>

      <UFormGroup
        label="New shop currency"
        :description="nextChangeMessage ?? undefined"
      >
        <USelectMenu
          v-model="state.currency"
          data-testid="settlement-currency-select"
          :options="options"
          :ui-menu="{ container: 'z-[60]' }"
          :disabled="!currentCanChange"
          value-attribute="value"
          name-attribute="label"
          searchable
          size="lg"
          placeholder="Choose a currency"
        />
      </UFormGroup>
    </div>
  </BaseDialog>
</template>
