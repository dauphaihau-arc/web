import type { components, paths } from '@arc/schemas/api/generated/openapi';

/**
 * The platform audit trail as an operator sees it. Rows cover the marketplace
 * entities operations can change (orders, products, finance records), and each
 * row points back at the entity it mutated.
 */

/** Metadata only: the API never stores free-text bodies in an audit summary. */
export type AdminAuditLogSummary = components['schemas']['AuditLogEntryResponseDto']['summary'];

export type AdminAuditLogEntry = components['schemas']['AuditLogEntryResponseDto'];

export type AdminAuditLogListResponse = components['schemas']['AuditLogListResponseDto'];

/**
 * The contract describes `action` and `entity_type` as repeatable query
 * parameters, while this app encodes the selected values as one comma-separated
 * value (see the audit list composable). The boundary keeps that serialized
 * form so the request on the wire does not change.
 */
type SerializedAuditLogFilters = {
  /**
   * Serialized action list, e.g. `order.status.overridden,order.refund.updated`.
   * A single value still matches exactly one action.
   */
  action?: string
  /** Serialized entity type list, e.g. `order,product`. */
  entity_type?: string
};

export type AdminAuditLogFilters = Omit<
  paths['/v1/admin/audit-logs']['get']['parameters']['query'],
  'page' | 'limit' | 'action' | 'entity_type'
> & SerializedAuditLogFilters;

export type ListAdminAuditLogsParams = Omit<
  paths['/v1/admin/audit-logs']['get']['parameters']['query'],
  'action' | 'entity_type'
> & SerializedAuditLogFilters;
