<script setup lang="ts">
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import type { PayoutAccountStatusMeta } from '../payout-account-status'

defineProps<{
  /** Provider status wording for the badge and headline. */
  status: PayoutAccountStatusMeta | null
  /** The account can receive payouts; show its settlement details instead. */
  isActive: boolean
  /** Stripe still needs information before it can review the account. */
  isActionRequired: boolean
  /** The onboarding mutation or the hosted redirect is in flight. */
  isBusy: boolean
  /** The provider-reported bank line, when it reported both parts. */
  bankSummary: string | null
  /** The currency the account settles in. */
  payoutCurrency: string
  /** The account's country. */
  countryLabel: string
}>()

const emit = defineEmits<{
  'continue-onboarding': []
}>()
</script>

<template>
  <div class="rounded-lg border border-border-subtle bg-surface p-5">
    <div class="flex items-center gap-2">
      <AppIcon
        name="payment"
        size="xs"
        class="text-text-subtle"
      />
      <span class="text-sm font-medium text-text-muted">Payout account</span>
    </div>

    <div class="mt-4">
      <div
        v-if="!isActive"
        class="text-lg font-semibold text-text-strong"
      >
        {{ status?.label }}
      </div>

      <p
        v-if="status && !isActive"
        class="mt-2 text-sm text-text-muted"
      >
        {{ status.description }}
      </p>

      <template v-if="isActive">
        <p
          v-if="bankSummary"
          class="mt-2 text-sm font-medium text-text-strong"
        >
          {{ bankSummary }}
        </p>

        <p
          v-if="bankSummary && payoutCurrency && countryLabel"
          class="mt-1 flex flex-wrap items-center gap-1 text-sm text-text-muted"
        >
          <span>Paid in</span>
          <StatusBadge
            color="gray"
            :label="payoutCurrency"
          />
          <span>· {{ countryLabel }}</span>
        </p>
        <p
          v-else-if="payoutCurrency && countryLabel"
          class="mt-2 flex flex-wrap items-center gap-1 text-sm text-text-muted"
        >
          <span>Paid in</span>
          <StatusBadge
            color="gray"
            :label="payoutCurrency"
          />
          <span>to an account in {{ countryLabel }}.</span>
        </p>
      </template>
    </div>

    <UButton
      v-if="isActionRequired"
      class="mt-4"
      :loading="isBusy"
      :disabled="isBusy"
      :icon="ICON_NAME_BY_ALIAS['externalLink']"
      @click="emit('continue-onboarding')"
    >
      Finish setup
    </UButton>
  </div>
</template>
