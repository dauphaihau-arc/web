<script setup lang="ts">
import type { AdminShopListEntry } from '~/domains/shops/api/contracts/admin-shops.contract'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import {
  formatShopStatusLabel,
  shopStatusTone,
} from '~/domains/shops/utils/shop-presentation'
import { routes } from '~/shared/navigation/routes'
import ShopCommissionScheduleCard from './shop-commission-schedule-card.vue'
import ShopDetailHeader from './shop-detail-header.vue'
import ShopFinancePermissionState from './shop-finance-permission-state.vue'
import ShopPayableCard from './shop-payable-card.vue'
import ShopPayoutAccountCard from './shop-payout-account-card.vue'
import ShopPayoutHistory from './shop-payout-history.vue'
import ShopsPermissionState from '../../_components/shops-permission-state.vue'
import { SHOP_DETAIL_TABS, useShopDetailPage } from '../_composables/use-shop-detail-page'

const props = defineProps<{
  shopId: string
}>()

const {
  shop,
  shopQuery,
  activeTab,
  isShopPermissionDenied,
  isFinancePermissionDenied,
  isNotFound,
  retry,
} = useShopDetailPage(() => props.shopId)

/**
 * The header only names the shop once the directory lookup resolved: while the
 * first read is pending, or after a not-found/error answer, there is no row to
 * identify and the generic title stays.
 */
const headerShop = computed<AdminShopListEntry | null>(() => {
  if (isShopPermissionDenied.value || shopQuery.isPending.value || shopQuery.isError.value || isNotFound.value) {
    return null
  }

  return shop.value
})

const tabs = [
  { label: 'Overview' },
  { label: 'Commission schedule' },
  { label: 'Payout history' },
]
</script>

<template>
  <LayoutAdminWrapperContent
    back-label="Shops"
    :back-to="routes.shops()"
    content-class="pb-12"
  >
    <template #title>
      <span class="inline-flex flex-wrap items-center gap-3">
        <span>{{ headerShop ? headerShop.shop_name : 'Shop details' }}</span>
        <StatusBadge
          v-if="headerShop"
          :color="shopStatusTone(headerShop.status)"
        >
          {{ formatShopStatusLabel(headerShop.status) }}
        </StatusBadge>
      </span>
    </template>

    <template
      v-if="headerShop"
      #description
    >
      Owner: {{ headerShop.owner_name || '—' }}
    </template>

    <template #content>
      <ShopsPermissionState v-if="isShopPermissionDenied" />

      <Empty
        v-else-if="shopQuery.isPending.value"
        loading
        variant="naked"
        size="xl"
        description="Loading shop..."
        container-class="min-h-[60vh]"
      />

      <Empty
        v-else-if="isNotFound"
        :icon="ICON_NAME_BY_ALIAS.marketplace"
        title="Shop not found"
        description="This shop may have been removed, or the link is no longer valid."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      />

      <Empty
        v-else-if="shopQuery.isError.value || !shop"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load shop"
        description="Something went wrong while loading this shop. Please try again."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      >
        <template #actions>
          <UButton
            color="gray"
            @click="retry"
          >
            Try again
          </UButton>
        </template>
      </Empty>

      <div
        v-else
        class="space-y-6"
      >
        <template v-if="!isFinancePermissionDenied">
          <UTabs
            v-model="activeTab"
            :items="tabs"
            :content="false"
          />

          <div
            v-if="activeTab === SHOP_DETAIL_TABS.overview"
            class="grid grid-cols-12 gap-6"
          >
            <div class="col-span-12 xl:col-span-5">
              <ShopDetailHeader :shop="shop" />
            </div>

            <div class="col-span-12 space-y-6 xl:col-span-7">
              <ShopPayableCard :shop-id="shopId" />
              <ShopPayoutAccountCard :shop-id="shopId" />
            </div>
          </div>

          <div
            v-else-if="activeTab === SHOP_DETAIL_TABS.commissionSchedule"
            class="grid grid-cols-12 gap-6"
          >
            <div class="col-span-12 xl:col-span-6">
              <ShopCommissionScheduleCard :shop-id="shopId" />
            </div>
          </div>

          <ShopPayoutHistory
            v-else
            :shop-id="shopId"
          />
        </template>

        <ShopFinancePermissionState v-else />
      </div>
    </template>
  </LayoutAdminWrapperContent>
</template>
