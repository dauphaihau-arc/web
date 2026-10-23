<script setup lang="ts">
import type { ShopFinanceSettlementCurrency } from '~/domains/shop/api/finance/contracts/settlement-currency.contract'
import {
  SETTLEMENT_CURRENCY_BLOCKED_REASON_LINKS,
  settlementCurrencyBlockedReasonMessage,
  settlementCurrencyNextChangeMessage,
} from '~/domains/shop/api/finance/settlement-currency-error-messages'
import SettlementCurrencyChangeDialog from './settlement-currency-change-dialog.vue'

const props = defineProps<{
  settings: ShopFinanceSettlementCurrency
}>()

const modal = useModal()

const blockedMessage = computed(() => settlementCurrencyBlockedReasonMessage(
  props.settings.blocked_reason,
  props.settings.next_change_allowed_at,
))

const blockedLink = computed(() => (
  props.settings.blocked_reason
    ? SETTLEMENT_CURRENCY_BLOCKED_REASON_LINKS[props.settings.blocked_reason]
    : null
))

/** Only an allowed change shows the schedule; a blocked one explains itself below. */
const nextChangeMessage = computed(() => (
  props.settings.can_change
    ? settlementCurrencyNextChangeMessage(props.settings.next_change_allowed_at)
    : null
))

function openChangeDialog() {
  if (!props.settings.can_change) {
    return
  }

  modal.open(SettlementCurrencyChangeDialog, {
    currency: props.settings.currency,
    nextChangeAllowedAt: props.settings.next_change_allowed_at,
    canChange: props.settings.can_change,
    blockedReason: props.settings.blocked_reason,
  })
}
</script>

<template>
  <div class="flex flex-col items-start gap-1 md:items-end">
    <UButton
      data-testid="settlement-currency"
      color="gray"
      size="sm"
      aria-label="Change shop currency"
      :disabled="!settings.can_change"
      @click="openChangeDialog"
    >
      {{ settings.currency }}
      <UIcon
        name="i-heroicons-chevron-down"
        class="size-4"
      />
    </UButton>

    <p
      v-if="blockedMessage"
      data-testid="settlement-currency-blocked-reason"
      class="text-xs text-text-subtle md:text-right"
    >
      {{ blockedMessage }}
      <NuxtLink
        v-if="blockedLink"
        :to="blockedLink.to"
        class="text-primary font-semibold underline"
      >
        {{ blockedLink.label }}
      </NuxtLink>
    </p>

    <p
      v-else-if="nextChangeMessage"
      data-testid="settlement-currency-next-change"
      class="text-xs text-text-subtle md:text-right"
    >
      {{ nextChangeMessage }}
    </p>
  </div>
</template>
