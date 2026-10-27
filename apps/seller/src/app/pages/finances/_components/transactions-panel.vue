<script setup lang="ts">
import Empty from '@arc/ui/primitives/empty.vue'
import FixedPagination from '@arc/ui/patterns/fixed-pagination.vue'
import type { ShopFinanceTransactionFilters } from '~/domains/shop/queries/transactions.query'
import {
  TRANSACTIONS_PAGE_LIMIT,
  useShopFinanceTransactions,
} from '~/domains/shop/queries/transactions.query'
import TransactionsFilterToolbar from './transactions-filter-toolbar.vue'
import TransactionsTable from './transactions-table.vue'

const filters = ref<ShopFinanceTransactionFilters>({})
const page = ref(1)

const hasFilters = computed(() => Object.keys(filters.value).length > 0)

const {
  data: response,
  isPending,
  isError,
  isFetching,
  refetch,
} = useShopFinanceTransactions(filters, page)

const transactions = computed(() => response.value?.transactions ?? [])
const total = computed(() => response.value?.total_results ?? 0)

function handleFilterChange(nextFilters: ShopFinanceTransactionFilters) {
  filters.value = nextFilters
  page.value = 1
}
</script>

<template>
  <div data-testid="transactions-panel">
    <TransactionsFilterToolbar @change="handleFilterChange" />

    <div
      v-if="isPending"
      class="space-y-3"
      data-testid="transactions-loading"
    >
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-8 w-full" />
    </div>

    <Empty
      v-else-if="isError && !response"
      title="Unable to load transactions"
      description="Reload the page to try again."
      data-testid="transactions-error"
    />

    <template v-else>
      <TransactionsTable
        :transactions="transactions"
        :loading="isFetching"
        :empty-label="hasFilters ? 'No transactions match these filters' : 'No transactions yet'"
      />

      <div
        v-if="isError"
        class="mt-4 flex flex-col items-center gap-2 rounded-md bg-surface-subtle p-3 text-sm text-text-muted"
        data-testid="transactions-page-error"
      >
        <span>Could not load this page of transactions.</span>
        <UButton
          color="gray"
          variant="soft"
          :loading="isFetching"
          data-testid="transactions-retry-page"
          @click="refetch()"
        >
          Try again
        </UButton>
      </div>

      <FixedPagination
        :page="page"
        :page-count="TRANSACTIONS_PAGE_LIMIT"
        :total="total"
        @on-change-page="page = $event"
      />
    </template>
  </div>
</template>
