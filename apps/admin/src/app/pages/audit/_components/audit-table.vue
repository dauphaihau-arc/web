<script setup lang="ts">
import type { AdminAuditLogEntry } from '~/domains/audit/api/contracts/admin-audit.contract'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import {
  formatAuditActionLabel,
  formatAuditModuleLabel,
  formatAuditTimestamp,
  readAuditActionTone,
  readAuditTarget,
  type AuditBadgeTone,
  type AuditTarget,
} from '~/domains/audit/utils/audit-presentation'
import FixedPagination from '@arc/ui/patterns/fixed-pagination.vue'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  logs: AdminAuditLogEntry[]
  page: number
  pageCount: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

type AuditTableRow = {
  id: string
  timestamp: string
  actor: string
  module: string
  action: string
  actionTone: AuditBadgeTone
  target: AuditTarget
  targetTo: ReturnType<typeof routes.orderDetail> | null
}

const rows = computed<AuditTableRow[]>(() =>
  props.logs.map((log) => {
    const target = readAuditTarget(
      log.entity_type,
      log.entity_public_id,
      log.entity_id,
    )
    let targetTo: AuditTableRow['targetTo'] = null

    if (target.linkKind === 'order' && target.linkId) {
      targetTo = routes.orderDetail(target.linkId)
    }
    else if (target.linkKind === 'shop' && target.linkId) {
      targetTo = routes.shopDetail(target.linkId)
    }

    return {
      id: log.id,
      timestamp: formatAuditTimestamp(log.created_at),
      actor: log.actor_email ?? 'Unknown',
      module: formatAuditModuleLabel(log.entity_type, log.action),
      action: formatAuditActionLabel(log.action),
      actionTone: readAuditActionTone(log.action),
      target,
      targetTo,
    }
  }),
)

const columns = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'actor', label: 'User' },
  { key: 'module', label: 'Module' },
  { key: 'action', label: 'Action' },
  { key: 'target', label: 'Target' },
]
</script>

<template>
  <div>
    <DataTable
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="{ icon: 'archive', label: 'No audit entries found.' }"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AppIcon
            name="archive"
            size="lg"
            class="text-text-muted"
          />
          <p class="text-sm text-text-muted">
            No audit entries match the current filters.
          </p>
        </div>
      </template>

      <template #timestamp-data="{ row }">
        <div class="whitespace-nowrap text-sm text-text-muted">
          {{ row.timestamp || '—' }}
        </div>
      </template>

      <template #actor-data="{ row }">
        <div class="break-all text-sm text-text-muted">
          {{ row.actor }}
        </div>
      </template>

      <template #module-data="{ row }">
        <div class="text-sm text-text-muted">
          {{ row.module }}
        </div>
      </template>

      <template #action-data="{ row }">
        <StatusBadge :color="row.actionTone">
          {{ row.action || '—' }}
        </StatusBadge>
      </template>

      <template #target-data="{ row }">
        <NuxtLink
          v-if="row.targetTo"
          :to="row.targetTo"
          prefetch
          class="break-all text-sm font-medium text-primary hover:underline"
        >
          {{ row.target.label }}
        </NuxtLink>
        <div
          v-else
          class="break-all text-sm text-text-muted"
        >
          {{ row.target.label || '—' }}
        </div>
      </template>
    </DataTable>

    <FixedPagination
      :page="page"
      :page-count="pageCount"
      :total="total"
      @on-change-page="emit('update:page', $event)"
    />
  </div>
</template>
