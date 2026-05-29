<script lang="ts" setup>
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import ShopItem from '~/app/components/order/shop-item/shop-item.vue'
import type { MyOrderListState } from '~/shared/api/me/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'
import { useGetOrderShops } from '~/shared/server-state/me/orders/order-shops.query'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const route = useRoute()
const router = useRouter()

type OrderFilter = {
  slot: string
  label: string
  state?: MyOrderListState
}

const orderStateValues = [
  'awaiting_payment',
  'processing',
  'shipped',
  'delivered',
  'canceled',
  'refunded',
] as const satisfies readonly MyOrderListState[]

const filters = [
  {
    slot: 'all-orders',
    label: 'All Orders',
    state: undefined,
  },
  {
    slot: 'to-pay',
    label: 'Awaiting Payment',
    state: 'awaiting_payment',
  },
  {
    slot: 'processing',
    label: 'Processing',
    state: 'processing',
  },
  {
    slot: 'shipped',
    label: 'Shipped',
    state: 'shipped',
  },
  {
    slot: 'delivered',
    label: 'Delivered',
    state: 'delivered',
  },
  {
    slot: 'canceled',
    label: 'Canceled',
    state: 'canceled',
  },
  {
    slot: 'refunded',
    label: 'Refunded',
    state: 'refunded',
  },
] satisfies OrderFilter[]

const state = reactive({
  search: typeof route.query.search === 'string' ? route.query.search : '',
})

const stateFilter = computed(() =>
  typeof route.query.state === 'string' && orderStateValues.includes(route.query.state as MyOrderListState)
    ? route.query.state as MyOrderListState
    : undefined,
)
const activeFilterLabel = computed(() =>
  filters.find(filter =>
    filter.state === stateFilter.value,
  )?.label ?? 'All Orders',
)
const activeFilterIndex = computed(() =>
  Math.max(0, filters.findIndex(filter => filter.label === activeFilterLabel.value)),
)

const queryParams = computed(() => ({
  ...(stateFilter.value ? { state: stateFilter.value } : {}),
  ...(state.search.trim() ? { search: state.search.trim() } : {}),
}))

const {
  data: dataGetOrderShops,
  isPending: isPendingGetOrders,
} = useGetOrderShops(queryParams)

function syncQuery(nextQuery: {
  search?: string
  state?: MyOrderListState
}) {
  const targetQuery = {
    ...(nextQuery.search ? { search: nextQuery.search } : {}),
    ...(nextQuery.state ? { state: nextQuery.state } : {}),
  }
  const currentQuery = {
    ...(typeof route.query.search === 'string' ? { search: route.query.search } : {}),
    ...(typeof route.query.state === 'string' ? { state: route.query.state } : {}),
  }

  if (JSON.stringify(targetQuery) === JSON.stringify(currentQuery)) {
    return
  }

  router.replace(routes.orders(targetQuery))
}

function selectFilter(filter: typeof filters[number]) {
  syncQuery({
    search: state.search.trim() || undefined,
    state: filter.state,
  })
}

function handleFilterChange(index: number) {
  const filter = filters[index]

  if (!filter) {
    return
  }

  selectFilter(filter)
}

watch(() => route.query.search, (search) => {
  state.search = typeof search === 'string' ? search : ''
})

watchDebounced(
  () => state.search,
  (search) => {
    syncQuery({
      search: search.trim() || undefined,
      state: stateFilter.value,
    })
  },
  { debounce: 400, maxWait: 800 },
)
</script>

<template>
  <div class="mt-8">
    <div class="mb-6 flex flex-col gap-4 ">
      <UTabs
        :items="filters"
        :model-value="activeFilterIndex"
        :ui="{ list: { base: 'w-full md:w-auto' } }"
        @change="handleFilterChange"
      />

      <UInput
        v-model="state.search"
        icon="i-heroicons-magnifying-glass-20-solid"
        placeholder="Search by order ID, product, or shop"
        class="w-full max-w-md"
        size="lg"
      />
    </div>

    <div
      v-if="isPendingGetOrders"
      class="grid h-[80vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div v-else-if="dataGetOrderShops?.order_shops && dataGetOrderShops.order_shops.length > 0">
      <h1 class="mb-6 text-2xl ml-1">
        Products you’ve ordered.
      </h1>
      <div class="ml-2 space-y-12">
        <div
          v-for="orderShop in dataGetOrderShops.order_shops"
          :key="orderShop.id"
        >
          <ShopItem :order-shop="orderShop" />
        </div>
      </div>
    </div>

    <div
      v-else
      class="text-center"
    >
      <h3 class="text-3xl text-customGray-950">
        {{ state.search || activeFilterLabel !== 'All Orders' ? 'No orders match this filter.' : 'Your orders is empty.' }}
      </h3>
    </div>
  </div>
</template>
