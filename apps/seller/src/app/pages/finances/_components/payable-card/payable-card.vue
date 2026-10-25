<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import Empty from '@arc/ui/primitives/empty.vue'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract'
import { useShopFinancePayable } from '~/domains/shop/queries/finance-payable.query'
import { useShopFinancePayoutAccount } from '~/domains/shop/queries/payout-account.query'
import { useShopFinancePayouts } from '~/domains/shop/queries/payouts.query'
import { useShopFinancePayoutSettings } from '~/domains/shop/queries/payout-settings.query'
import ManualPayoutDialog from './manual-payout-dialog.vue'

const { data: payable, isPending, isError } = useShopFinancePayable()
const {
  data: payoutAccountResponse,
  isPending: isPayoutAccountPending,
  isError: isPayoutAccountError,
} = useShopFinancePayoutAccount()

const { data: payoutsResponse } = useShopFinancePayouts()
const { data: payoutSettings } = useShopFinancePayoutSettings()
const modal = useModal()

const payoutAccount = computed<ShopFinancePayoutAccount | null | undefined>(() => (
  isPayoutAccountPending.value || isPayoutAccountError.value
    ? undefined
    : (payoutAccountResponse.value?.payout_account ?? null)
))

const hasPendingPayout = computed(() => (
  payoutsResponse.value?.payouts.some(payout => payout.state === 'pending') ?? false
))

const remaining = computed(() => payoutSettings.value?.manual_withdrawals_remaining)

const isNegative = computed(() => (
  (payable.value?.available_minor ?? 0) + (payable.value?.not_yet_available_minor ?? 0) < 0
))

/** The reason the withdrawal cannot be requested, or null when it can. */
const disabledReason = computed(() => {
  if (hasPendingPayout.value) {
    return 'A payout is already pending. Wait for it to finish before withdrawing again.'
  }

  if (remaining.value !== undefined && remaining.value !== null && remaining.value <= 0) {
    return 'You have already made your manual withdrawal this month.'
  }

  if (payoutAccount.value === null) {
    return 'Add a payout account before withdrawing.'
  }

  if (payoutAccount.value && (payoutAccount.value.status !== 'active' || !payoutAccount.value.verified_at)) {
    return 'Your payout account is not verified yet.'
  }

  return null
})

function openWithdrawDialog() {
  if (!payable.value || payable.value.available_minor <= 0 || disabledReason.value) {
    return
  }

  modal.open(ManualPayoutDialog, {
    availableMinor: payable.value.available_minor,
    currency: payable.value.currency,
  })
}
</script>

<template>
  <div
    v-if="isPending"
    class="rounded-lg border border-border-subtle bg-surface p-5"
  >
    <USkeleton class="h-5 w-16" />
    <USkeleton class="mt-5 h-8 w-32" />
    <USkeleton class="mt-4 h-8 w-32" />
  </div>

  <Empty
    v-else-if="isError || !payable"
    title="Unable to load balance"
    description="Reload the page to try again."
  />

  <div
    v-else
    class="rounded-lg border border-border-subtle bg-surface p-5"
  >
    <div>
      <div class="text-sm text-text-muted">
        Available balance
      </div>
      <div class="mt-1 text-2xl font-semibold text-text-strong">
        {{ formatMinorCurrency(payable.available_minor, payable.currency) }}
      </div>

      <div class="mt-3 flex items-center gap-2">
        <UButton
          :disabled="payable.available_minor <= 0 || remaining === undefined || Boolean(disabledReason)"
          :loading="remaining === undefined"
          @click="openWithdrawDialog"
        >
          Withdraw now
        </UButton>

        <UTooltip
          v-if="disabledReason"
          :text="disabledReason"
        >
          <span
            tabindex="0"
            class="inline-flex cursor-help items-center"
            aria-label="Why withdrawal is unavailable"
          >
            <AppIcon
              name="info"
              size="sm"
              class="text-text-subtle"
            />
          </span>
        </UTooltip>
      </div>
    </div>

    <div class="mt-4 border-t border-border-subtle pt-4">
      <div class="text-sm text-text-muted">
        Pending
      </div>
      <div class="mt-1 text-2xl font-semibold text-text-strong">
        {{ formatMinorCurrency(payable.not_yet_available_minor, payable.currency) }}
      </div>
      <p class="mt-1 text-xs text-text-subtle">
        Releases after delivery
      </p>
    </div>

    <p
      v-if="isNegative"
      class="mt-4 rounded-md bg-surface-subtle p-3 text-sm text-text-muted"
    >
      Your balance is negative. It is carried into your next payout and netted
      before anything is sent.
    </p>
  </div>
</template>
