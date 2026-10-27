<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { useAdminShopPayoutAccount } from '~/domains/finance/queries/payout-account.query'
import {
  payoutAccountStatusLabel,
  payoutAccountStatusTone,
} from '~/domains/finance/utils/finance-presentation'
import {
  formatPayoutAccountBankLine,
  payoutAccountProviderLabel,
} from './finance-presentation'

const props = defineProps<{
  shopId: string
}>()

const {
  data: response,
  isPending,
  isError,
  refetch,
} = useAdminShopPayoutAccount(() => props.shopId)

const account = computed(() => response.value?.payout_account ?? null)
const bankLine = computed(() => (account.value ? formatPayoutAccountBankLine(account.value) : null))
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Payout account
    </div>

    <div
      v-if="isPending"
      class="mt-4"
    >
      <USkeleton class="h-5 w-24" />
      <USkeleton class="mt-4 h-8 w-32" />
      <USkeleton class="mt-3 h-5 w-48" />
    </div>

    <Empty
      v-else-if="isError || !response"
      class="mt-4"
      variant="subtle"
      :icon="ICON_NAME_BY_ALIAS.warning"
      title="Unable to load payout account"
      description="Something went wrong while loading this shop's payout account."
    >
      <template #actions>
        <UButton
          color="gray"
          size="sm"
          @click="refetch()"
        >
          Try again
        </UButton>
      </template>
    </Empty>

    <Empty
      v-else-if="!account"
      class="mt-4"
      variant="subtle"
      :icon="ICON_NAME_BY_ALIAS.payment"
      title="No payout account onboarded"
      description="This shop has not connected an account to receive payouts."
    />

    <div
      v-else
      class="mt-4 space-y-4 text-sm"
    >
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge
          :label="payoutAccountStatusLabel(account.status)"
          :color="payoutAccountStatusTone(account.status)"
        />
        <span class="text-text-muted">{{ payoutAccountProviderLabel(account.provider) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
            Payouts enabled
          </div>
          <div class="text-text-muted">
            {{ account.payouts_enabled ? 'Yes' : 'No' }}
          </div>
        </div>
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
            Charges enabled
          </div>
          <div class="text-text-muted">
            {{ account.charges_enabled ? 'Yes' : 'No' }}
          </div>
        </div>
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
            Currency
          </div>
          <div class="text-text-muted">
            {{ account.currency }}
          </div>
        </div>
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
            Country
          </div>
          <div class="text-text-muted">
            {{ account.country }}
          </div>
        </div>
      </div>

      <div>
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Bank
        </div>
        <div class="text-text-muted">
          {{ bankLine ?? '—' }}
        </div>
      </div>

      <div v-if="account.requirements?.currently_due.length">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Requirements due
        </div>
        <ul class="mt-1 list-disc space-y-1 pl-5 text-text-muted">
          <li
            v-for="requirement in account.requirements.currently_due"
            :key="requirement"
            class="break-all font-mono text-xs"
          >
            {{ requirement }}
          </li>
        </ul>
      </div>

      <div v-if="account.requirements?.disabled_reason">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Disabled reason
        </div>
        <div class="break-all font-mono text-xs text-text-muted">
          {{ account.requirements.disabled_reason }}
        </div>
      </div>
    </div>
  </UCard>
</template>
