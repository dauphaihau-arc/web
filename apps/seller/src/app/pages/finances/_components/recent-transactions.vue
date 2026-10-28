<script setup lang="ts">
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import Empty from '@arc/ui/patterns/empty.vue'
import { useShopFinanceRecentTransactions } from '~/domains/shop/queries/transactions.query'
import TransactionsTable from './transactions-table.vue'

const { data: response, isPending, isError } = useShopFinanceRecentTransactions()

const transactions = computed(() => response.value?.transactions ?? [])
</script>

<template>
  <div
    class="mt-4 rounded-lg border border-border-subtle bg-surface p-5"
    data-testid="recent-transactions"
  >
    <div class="flex items-center gap-2">
      <AppIcon
        name="receiptText"
        size="xs"
        class="text-text-subtle"
      />
      <span class="text-sm font-medium text-text-muted">Recent transactions</span>
    </div>

    <div
      v-if="isPending"
      class="mt-4 space-y-3"
      data-testid="recent-transactions-loading"
    >
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-8 w-full" />
    </div>

    <Empty
      v-else-if="isError || !response"
      class="mt-4"
      title="Unable to load transactions"
      description="Reload the page to try again."
      data-testid="recent-transactions-error"
    />

    <TransactionsTable
      v-else
      class="mt-4"
      :transactions="transactions"
      empty-label="No transactions yet"
    />
  </div>
</template>
