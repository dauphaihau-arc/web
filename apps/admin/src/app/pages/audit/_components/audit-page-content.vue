<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import { usePermissions } from '~/shared/composables/use-permissions'
import AuditFilterToolbar from './audit-filter-toolbar.vue'
import AuditPermissionState from './audit-permission-state.vue'
import AuditTable from './audit-table.vue'
import AuditTableSkeleton from './audit-table-skeleton.vue'
import { ADMIN_AUDIT_PAGE_SIZE, useAdminAuditList } from '../_composables/use-admin-audit-list'

const { can } = usePermissions()

const {
  page,
  actions,
  entityTypes,
  search,
  query,
  isPermissionDenied,
  isExporting,
  exportCsv,
} = useAdminAuditList()

const canReadAudit = computed(() => can(PERMISSIONS.auditRead))
const isAccessDenied = computed(() => !canReadAudit.value || isPermissionDenied.value)

const entries = computed(() => query.data.value?.results ?? [])
const totalResults = computed(() => query.data.value?.total_results ?? 0)

function retry() {
  void query.refetch()
}
</script>

<template>
  <LayoutAdminWrapperContent content-class="pb-12">
    <template #title>
      Audit
    </template>
    <template #description>
      Operator actions recorded against marketplace entities.
    </template>
    <template #content>
      <AuditPermissionState v-if="isAccessDenied" />

      <Empty
        v-else-if="query.isError.value"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load the audit log"
        description="Something went wrong while loading the audit trail. Please try again."
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
        <AuditFilterToolbar
          v-model:actions="actions"
          v-model:entity-types="entityTypes"
          v-model:search="search"
          :is-exporting="isExporting"
          @export="exportCsv"
        />

        <AuditTableSkeleton v-if="query.isPending.value" />

        <AuditTable
          v-else
          :logs="entries"
          :page="page"
          :page-count="ADMIN_AUDIT_PAGE_SIZE"
          :total="totalResults"
          @update:page="page = $event"
        />
      </template>
    </template>
  </LayoutAdminWrapperContent>
</template>
