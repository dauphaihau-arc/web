<script setup lang="ts">
import { ShippingProfileStatuses } from '@arc/enums/shipping'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import FixedPagination from '~/shared/ui/fixed-pagination.vue'
import ShippingProfileCoverageCell from './shipping-profile-coverage-cell.vue'
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'

const props = defineProps<{
  profiles: ShippingProfileResource[]
  loading: boolean
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  'archive': [profile: ShippingProfileResource]
  'clear-default': [profile: ShippingProfileResource]
  'edit': [profile: ShippingProfileResource]
  'set-default': [profile: ShippingProfileResource]
  'update:page': [value: number]
}>()

const columns = [
  { key: 'name', label: 'Profile' },
  { key: 'status', label: 'Status' },
  { key: 'processing', label: 'Processing' },
  { key: 'coverage', label: 'Coverage and rates' },
  { key: 'products', label: 'Products' },
  { key: 'actions', label: '' },
]

function statusColor(status: ShippingProfileResource['status']) {
  if (status === ShippingProfileStatuses.ACTIVE) return 'green'
  if (status === ShippingProfileStatuses.DRAFT) return 'yellow'
  return 'gray'
}

function processingTimeLabel(profile: ShippingProfileResource) {
  if (profile.processing_time_min_days === undefined || profile.processing_time_max_days === undefined) {
    return '-'
  }
  return `${profile.processing_time_min_days}–${profile.processing_time_max_days} days`
}
</script>

<template>
  <div>
    <DataTable
      :rows="props.profiles"
      :columns="columns"
      :loading="props.loading"
      :selectable="false"
      :empty-state="{ icon: 'i-heroicons-truck-20-solid', label: 'No Shipping Profiles yet.' }"
    >
      <template #name-data="{ row }">
        <div class="min-w-40 space-y-2">
          <div class="font-semibold text-text-strong">
            {{ row.name }}
          </div>
          <StatusBadge
            v-if="row.is_default"
            color="blue"
          >
            Default
          </StatusBadge>
        </div>
      </template>

      <template #status-data="{ row }">
        <div class="min-w-24">
          <StatusBadge
            :color="statusColor(row.status)"
            class="capitalize"
          >
            {{ row.status }}
          </StatusBadge>
        </div>
      </template>

      <template #processing-data="{ row }">
        <div class="min-w-32 text-sm text-text-muted">
          {{ processingTimeLabel(row) }}
        </div>
      </template>

      <template #coverage-data="{ row }">
        <ShippingProfileCoverageCell :profile="row" />
      </template>

      <template #products-data="{ row }">
        <div class="min-w-32 text-sm">
          <div
            v-if="row.assigned_product_count === 0"
            class="text-text-muted"
          >
            -
          </div>
          <div v-else>
            <span class="font-medium">{{ row.assigned_product_count }}</span> assigned
          </div>
          <!-- <div class="text-text-muted">
            <span class="font-medium">{{ row.published_product_count }}</span> published
          </div> -->
        </div>
      </template>

      <template #actions-data="{ row }">
        <div class="flex w-full items-center justify-end gap-1">
          <UTooltip
            v-if="row.is_default"
            text="Clear default"
          >
            <UButton
              color="gray"
              variant="ghost"
              data-row-hover-action
              class="p-1.5 transition-opacity"
              aria-label="Clear default"
              @click="emit('clear-default', row)"
            >
              <AppIcon name="star" />
            </UButton>
          </UTooltip>
          <UTooltip
            v-else-if="row.checkout_ready && row.status !== ShippingProfileStatuses.ARCHIVED"
            text="Set as default"
          >
            <UButton
              color="gray"
              variant="ghost"
              data-row-hover-action
              class="p-1.5 transition-opacity"
              aria-label="Set as default"
              @click="emit('set-default', row)"
            >
              <AppIcon name="star" />
            </UButton>
          </UTooltip>
          <UTooltip
            :text="row.status === ShippingProfileStatuses.ARCHIVED ? 'Archived profiles cannot be edited' : 'Edit profile'"
          >
            <UButton
              color="gray"
              variant="ghost"
              data-row-hover-action
              class="p-1.5 transition-opacity"
              :disabled="row.status === ShippingProfileStatuses.ARCHIVED"
              @click="emit('edit', row)"
            >
              <AppIcon name="edit" />
            </UButton>
          </UTooltip>
          <UTooltip
            :text="row.status === ShippingProfileStatuses.ARCHIVED ? 'Already archived' : 'Archive profile'"
          >
            <UButton
              color="gray"
              variant="ghost"
              data-row-hover-action
              class="p-1.5 transition-opacity"
              :disabled="row.status === ShippingProfileStatuses.ARCHIVED"
              @click="emit('archive', row)"
            >
              <AppIcon name="archive" />
            </UButton>
          </UTooltip>
        </div>
      </template>
    </DataTable>

    <FixedPagination
      :page="props.page"
      :page-count="props.pageCount"
      :total="props.total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
