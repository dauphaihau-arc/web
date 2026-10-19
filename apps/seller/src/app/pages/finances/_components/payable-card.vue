<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import type { ShopFinancePayable } from '~/domains/shop/api/finance/contracts/payable.contract'

defineProps<{
  payable: ShopFinancePayable
}>()
</script>

<template>
  <div class="rounded-lg border border-border-subtle bg-surface p-5">
    <div class="flex items-center gap-2">
      <AppIcon
        name="revenue"
        size="xs"
        class="text-text-subtle"
      />
      <span class="text-sm font-medium text-text-muted">{{ payable.currency }}</span>
    </div>

    <div class="mt-4">
      <div class="text-sm text-text-muted">
        Available
      </div>
      <div class="mt-1 text-2xl font-semibold text-text-strong">
        {{ formatMinorCurrency(payable.available_minor, payable.currency) }}
      </div>
    </div>

    <div class="mt-4 border-t border-border-subtle pt-4">
      <div class="text-sm text-text-muted">
        Not yet available
      </div>
      <div class="mt-1 text-2xl font-semibold text-text-strong">
        {{ formatMinorCurrency(payable.not_yet_available_minor, payable.currency) }}
      </div>
    </div>
  </div>
</template>
