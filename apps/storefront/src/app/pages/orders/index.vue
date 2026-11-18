<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import Empty from '@arc/ui/patterns/empty.vue'
import ShopItem from '~/domains/me/ui/order-shop/shop-item/shop-item.vue'
import type { MyOrderListState } from '~/domains/me/api/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'
import { useGetOrderShops } from '~/domains/me/queries/orders/order-shops.query'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const t = useAccountTranslator()
const { localizePath } = useLocalizedRoute()

type OrderFilter = {
  slot: string
  labelKey: string
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
    labelKey: 'account.orders.tabs.all',
    state: undefined,
  },
  {
    slot: 'to-pay',
    labelKey: 'account.orders.tabs.awaitingSummary',
    state: 'awaiting_payment',
  },
  {
    slot: 'processing',
    labelKey: 'account.orders.tabs.processing',
    state: 'processing',
  },
  {
    slot: 'shipped',
    labelKey: 'account.orders.tabs.shipped',
    state: 'shipped',
  },
  {
    slot: 'delivered',
    labelKey: 'account.orders.tabs.delivered',
    state: 'delivered',
  },
  {
    slot: 'canceled',
    labelKey: 'account.orders.tabs.canceled',
    state: 'canceled',
  },
  {
    slot: 'refunded',
    labelKey: 'account.orders.tabs.refunded',
    state: 'refunded',
  },
] satisfies OrderFilter[]

const state = reactive({
  search: typeof route.query.search === 'string' ? route.query.search : '',
})
const search = toRef(state, 'search')
const debouncedSearch = refDebounced(search, 400, { maxWait: 800 })

const stateFilter = computed(() =>
  typeof route.query.state === 'string' && orderStateValues.includes(route.query.state as MyOrderListState)
    ? route.query.state as MyOrderListState
    : undefined,
)
const filterTabItems = computed(() =>
  filters.map(filter => ({
    label: t(filter.labelKey),
    value: filter.slot,
  })),
)
const activeFilterTab = computed(() =>
  filters.find(filter => filter.state === stateFilter.value)?.slot ?? filters[0].slot,
)

const queryParams = computed(() => ({
  ...(stateFilter.value ? { state: stateFilter.value } : {}),
  ...(debouncedSearch.value.trim() ? { search: debouncedSearch.value.trim() } : {}),
}))

const {
  data: dataGetOrderShops,
  isPending: isPendingGetOrders,
  isFetching: isFetchingGetOrders,
} = useGetOrderShops(queryParams)

const orderShops = computed(() => dataGetOrderShops.value?.order_shops ?? [])
const isFiltering = computed(() => !!state.search.trim() || !!stateFilter.value)

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

  router.replace(localizePath(routes.orders(targetQuery)))
}

function selectFilter(filter: typeof filters[number]) {
  syncQuery({
    search: state.search.trim() || undefined,
    state: filter.state,
  })
}

function handleFilterChange(value: string | number) {
  const filter = filters.find(item => item.slot === value)

  if (filter) {
    selectFilter(filter)
  }
}

watch(() => route.query.search, (search) => {
  state.search = typeof search === 'string' ? search : ''
})

watch(
  debouncedSearch,
  (search) => {
    syncQuery({
      search: search.trim() || undefined,
      state: stateFilter.value,
    })
  },
)
</script>

<template>
  <div class="mx-auto mt-8 max-w-home-layout px-4 md:px-12 lg:px-16">
    <div class="mb-8">
      <SectionHeader
        :title="t('account.orders.title')"
        :description="t('account.orders.description')"
        heading-class="text-2xl font-semibold text-text-strong md:text-3xl"
      />
    </div>

    <div class="mb-10 flex flex-col gap-4">
      <div class="-mx-4 min-w-0 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 lg:overflow-visible lg:pb-0">
        <AppTabs
          :aria-label="t('account.orders.filterAria')"
          :items="filterTabItems"
          :model-value="activeFilterTab"
          @change="handleFilterChange"
        />
      </div>

      <UInput
        v-model="state.search"
        :icon="ICON_NAME_BY_ALIAS['searchSolid']"
        :placeholder="t('account.orders.searchPlaceholder')"
        class="w-full max-w-md"
        size="lg"
      />
    </div>

    <Empty
      v-if="isPendingGetOrders"
      loading
      variant="naked"
      size="lg"
      class="min-h-[60vh]"
      :title="t('account.orders.loading')"
    />

    <div v-else-if="orderShops.length > 0">
      <div
        class="space-y-10 transition-opacity md:ml-2 md:space-y-12"
        :class="isFetchingGetOrders ? 'opacity-60' : 'opacity-100'"
        :aria-busy="isFetchingGetOrders ? 'true' : undefined"
      >
        <div
          v-for="orderShop in orderShops"
          :key="orderShop.id"
        >
          <ShopItem :order-shop="orderShop" />
        </div>
      </div>
    </div>

    <Empty
      v-else-if="isFiltering"
      variant="naked"
      size="lg"
      icon="search"
      :title="t('account.orders.emptyFilteredTitle')"
      :description="t('account.orders.emptyFilteredDescription')"
      :actions="[{
        label: t('account.orders.clearFilters'),
        to: localizePath(routes.orders()),
        color: 'gray',
      }]"
    />

    <Empty
      v-else
      variant="naked"
      size="lg"
      icon="orders"
      :title="t('account.orders.emptyTitle')"
      :description="t('account.orders.emptyDescription')"
      :actions="[{
        label: t('account.orders.browseShops'),
        to: localizePath(routes.home()),
        color: 'gray',
      }]"
    />
  </div>
</template>
