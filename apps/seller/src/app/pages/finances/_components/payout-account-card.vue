<script setup lang="ts">
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import type { ShopFinancePayoutAccount } from '~/domains/shop/api/finance/contracts/payout-account.contract'

const props = defineProps<{
  account: ShopFinancePayoutAccount
}>()

defineEmits<{
  replace: []
}>()

const statusByValue = {
  pending: { label: 'Pending', color: 'yellow' },
  active: { label: 'Active', color: 'green' },
  disabled: { label: 'Disabled', color: 'gray' },
} as const

const status = computed(() => statusByValue[props.account.status])
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
      <StatusBadge
        class="ml-auto"
        :label="status.label"
        :color="status.color"
      />
    </div>

    <div class="mt-4">
      <div class="text-sm text-text-muted">
        Bank
      </div>
      <div class="mt-1 text-lg font-semibold text-text-strong">
        {{ account.bank_name }} ••{{ account.last4 }}
      </div>
    </div>

    <div class="mt-4 border-t border-border-subtle pt-4">
      <div class="text-sm text-text-muted">
        Account holder
      </div>
      <div class="mt-1 text-sm font-medium text-text-strong">
        {{ account.holder_name }}
      </div>
    </div>

    <UButton
      class="mt-4"
      color="gray"
      @click="$emit('replace')"
    >
      Replace bank account
    </UButton>
  </div>
</template>
