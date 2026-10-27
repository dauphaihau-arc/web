<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import ShopsFilterToolbar from './shops-filter-toolbar.vue'
import ShopsPermissionState from './shops-permission-state.vue'
import ShopsTable from './shops-table.vue'
import ShopsTableSkeleton from './shops-table-skeleton.vue'
import { ADMIN_SHOPS_PAGE_SIZE, useAdminShopsList } from '../_composables/use-admin-shops-list'

const {
  page,
  search,
  query,
  isPermissionDenied,
} = useAdminShopsList()

const entries = computed(() => query.data.value?.results ?? [])
const totalResults = computed(() => query.data.value?.total_results ?? 0)

function retry() {
  void query.refetch()
}
</script>

<template>
  <LayoutAdminWrapperContent content-class="pb-12">
    <template #title>
      Shops
    </template>
    <template #description>
      Every shop in the marketplace.
    </template>
    <template #content>
      <ShopsPermissionState v-if="isPermissionDenied" />

      <Empty
        v-else-if="query.isError.value"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load shops"
        description="Something went wrong while loading the shop directory. Please try again."
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

      <template v-else>
        <ShopsFilterToolbar v-model:search="search" />

        <ShopsTableSkeleton v-if="query.isPending.value" />

        <ShopsTable
          v-else
          :shops="entries"
          :page="page"
          :page-count="ADMIN_SHOPS_PAGE_SIZE"
          :total="totalResults"
          @update:page="page = $event"
        />
      </template>
    </template>
  </LayoutAdminWrapperContent>
</template>
