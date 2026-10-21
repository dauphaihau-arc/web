<script setup lang="ts">
import Empty from '@arc/ui/primitives/empty.vue'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { useShopFinancePayoutAccount } from '~/domains/shop/queries/payout-account.query'
import PayoutAccountDialog from './payout-account-dialog.vue'

const { data: response, isPending, isError } = useShopFinancePayoutAccount()
const modal = useModal()

const account = computed(() => response.value?.payout_account ?? null)

const statusByValue = {
  pending: { label: 'Pending', color: 'yellow' },
  active: { label: 'Active', color: 'green' },
  disabled: { label: 'Disabled', color: 'gray' },
} as const

const status = computed(() => (
  account.value ? statusByValue[account.value.status] : null
))

function openPayoutAccountDialog() {
  modal.open(PayoutAccountDialog, { account: account.value })
}
</script>

<template>
  <div
    v-if="isPending"
    class="rounded-lg border border-border-subtle bg-surface p-5"
  >
    <USkeleton class="h-5 w-32" />
    <USkeleton class="mt-5 h-8 w-48" />
    <USkeleton class="mt-4 h-5 w-40" />
  </div>

  <Empty
    v-else-if="isError"
    title="Unable to load payout account"
    description="Reload the page to try again."
  />

  <Empty
    v-else-if="!account"
    icon="payment"
    size="lg"
    title="No payout account yet"
    description="Add the bank account you want to be paid into"
  >
    <template #actions>
      <UButton
        icon="i-heroicons-plus"
        @click="openPayoutAccountDialog"
      >
        Add bank account
      </UButton>
    </template>
  </Empty>

  <div
    v-else
    class="rounded-lg border border-border-subtle bg-surface p-5"
  >
    <div class="flex items-center gap-2">
      <AppIcon
        name="payment"
        size="xs"
        class="text-text-subtle"
      />
      <span class="text-sm font-medium text-text-muted">Payout account</span>
      <StatusBadge
        v-if="status"
        class="ml-auto"
        :label="status.label"
        :color="status.color"
      />
    </div>

    <div class="mt-4">
      <div class="text-lg font-semibold text-text-strong">
        {{ account.bank_name }} ••{{ account.last4 }}
      </div>
    </div>

    <UButton
      class="mt-4"
      color="gray"
      @click="openPayoutAccountDialog"
    >
      Replace bank account
    </UButton>
  </div>
</template>
