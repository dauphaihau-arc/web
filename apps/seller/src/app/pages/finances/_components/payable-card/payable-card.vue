<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import Empty from '@arc/ui/patterns/empty.vue'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import { usePayableCard } from './use-payable-card'

const {
  payable,
  isPending,
  isError,
  remaining,
  isNegative,
  disabledReason,
  openWithdrawDialog,
} = usePayableCard()
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
