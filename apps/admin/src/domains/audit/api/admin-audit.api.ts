import type {
  AdminAuditLogFilters,
  AdminAuditLogListResponse,
  ListAdminAuditLogsParams,
} from './contracts/admin-audit.contract';
import { apiClient } from '~/domains/_shared/api-client';

const ADMIN_AUDIT_LOGS = '/admin/audit-logs';

export const adminAuditApi = {
  /** Audit entries, newest first. The API owns paging and matching. */
  list(params: ListAdminAuditLogsParams) {
    return apiClient.get<AdminAuditLogListResponse>(ADMIN_AUDIT_LOGS, params);
  },

  /**
   * The same trail as a CSV attachment. The API caps the export, so the client
   * only forwards the active filters and stores the returned text as a file.
   */
  exportCsv(params: AdminAuditLogFilters) {
    return apiClient.get<string>(
      `${ADMIN_AUDIT_LOGS}/export`,
      params,
      { responseType: 'text' },
    );
  },
};
