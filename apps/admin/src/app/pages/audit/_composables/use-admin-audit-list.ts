import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import { toastCustom } from '~/shared/config/toast';
import type {
  AdminAuditLogFilters,
  ListAdminAuditLogsParams,
} from '~/domains/audit/api/contracts/admin-audit.contract';
import { adminAuditApi } from '~/domains/audit/api/admin-audit.api';
import { useAdminAuditLogs } from '~/domains/audit/queries/list.query';
import { downloadAuditCsv } from '~/domains/audit/utils/audit-export';

export const ADMIN_AUDIT_PAGE_SIZE = 20;

export function useAdminAuditList() {
  const toast = useToast();

  const page = ref(1);
  const actions = ref<string[]>([]);
  const entityTypes = ref<string[]>([]);
  const search = ref('');
  const isExporting = ref(false);

  // The API takes comma-separated lists, so the multi-selects serialize here.
  const filters = computed<AdminAuditLogFilters>(() => {
    const appliedSearch = search.value.trim();

    return {
      ...(actions.value.length > 0 ? { action: actions.value.join(',') } : {}),
      ...(entityTypes.value.length > 0 ? { entity_type: entityTypes.value.join(',') } : {}),
      ...(appliedSearch ? { search: appliedSearch } : {}),
    };
  });

  const params = computed<ListAdminAuditLogsParams>(() => ({
    page: page.value,
    limit: ADMIN_AUDIT_PAGE_SIZE,
    ...filters.value,
  }));

  const query = useAdminAuditLogs(params);

  watch([actions, entityTypes, search], () => {
    page.value = 1;
  }, { deep: true });

  const isPermissionDenied = computed(() =>
    query.isError.value
    && getStatusCode(query.error.value) === 403
    && readApiError(query.error.value).code === 'MISSING_REQUIRED_PERMISSIONS',
  );

  async function exportCsv() {
    if (isExporting.value) {
      return;
    }

    isExporting.value = true;

    try {
      const csv = await adminAuditApi.exportCsv(filters.value);

      downloadAuditCsv(csv);
    }
    catch (error) {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to export the audit log',
        description: readApiError(error).message,
      });
    }
    finally {
      isExporting.value = false;
    }
  }

  return {
    page,
    actions,
    entityTypes,
    search,
    query,
    isPermissionDenied,
    isExporting,
    exportCsv,
  };
}
