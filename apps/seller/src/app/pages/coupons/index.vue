<script lang="ts" setup>
import { CreateCouponPageTypes } from '@arc/enums/shop'
import type { CouponTypeFilter } from './_components/coupon-type-filter-options'
import CouponsFilterToolbar from './_components/coupons-filter-toolbar.vue'
import CouponsTable from './_components/coupons-table.vue'
import CouponsTypeTabs from './_components/coupons-type-tabs.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetCoupons } from '~/shared/server-state/shop/coupon/coupons.query'
import type {
  ListShopCouponsRequest,
} from '~/shared/api/shop/coupon/contracts/coupon.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
const pageCount = 10
const page = ref(1)
const activeFilters = ref<Partial<ListShopCouponsRequest>>({})
const typeFilter = ref<CouponTypeFilter | undefined>()

const params = computed(() => ({
  page: page.value,
  limit: pageCount,
  ...activeFilters.value,
}))

const couponCountBaseParams = computed<ListShopCouponsRequest>(() => ({
  ...activeFilters.value,
  page: 1,
  limit: 1,
  is_auto_sale: undefined,
}))

const {
  isPending: isPendingShopGetCoupons,
  data: dataShopGetCoupons,
  refetch: refetchShopGetCoupons,
} = useShopGetCoupons(params)

const allCouponsCountQuery = useShopGetCoupons(couponCountBaseParams)
const promoCodeCouponsCountQuery = useShopGetCoupons(computed(() => ({
  ...couponCountBaseParams.value,
  is_auto_sale: false,
})))
const saleCouponsCountQuery = useShopGetCoupons(computed(() => ({
  ...couponCountBaseParams.value,
  is_auto_sale: true,
})))
const typeTabCounts = computed(() => {
  const counts = dataShopGetCoupons.value?.type_counts

  if (counts) {
    return counts
  }

  return {
    all: allCouponsCountQuery.data.value?.total_results ?? (dataShopGetCoupons.value?.total_results ?? 0),
    promo_code: promoCodeCouponsCountQuery.data.value?.total_results ?? 0,
    sale: saleCouponsCountQuery.data.value?.total_results ?? 0,
  }
})

function handleToolbarChange(payload: Partial<ListShopCouponsRequest>) {
  activeFilters.value = payload
}

watch(typeFilter, () => {
  page.value = 1
})
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Coupons
    </template>
    <template #actions>
      <div class="space-x-3">
        <UButton
          :to="routes.couponsNew(CreateCouponPageTypes.PROMO_CODE)"
          size="sm"
        >
          + Create a promo code
        </UButton>
        <UButton
          :to="routes.couponsNew(CreateCouponPageTypes.SALE)"
          size="sm"
        >
          + Run sale
        </UButton>
      </div>
    </template>

    <template #content>
      <CouponsTypeTabs
        v-model="typeFilter"
        :counts="typeTabCounts"
      />
      <CouponsFilterToolbar
        v-model:type-filter="typeFilter"
        @change="handleToolbarChange"
        @reset-page="page = 1"
      />
      <CouponsTable
        :coupons="dataShopGetCoupons?.results ?? []"
        :loading="isPendingShopGetCoupons"
        :page="page"
        :page-count="pageCount"
        :total="dataShopGetCoupons?.total_results ?? 0"
        @update:page="page = $event"
        @refresh="refetchShopGetCoupons"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
