/**
 * The platform audit trail as an operator sees it. Rows cover the marketplace
 * entities operations can change (orders, products, finance records), and each
 * row points back at the entity it mutated.
 */

/** Metadata only: the API never stores free-text bodies in an audit summary. */
export type AdminAuditLogSummary = Record<string, unknown>;

export interface AdminAuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string
  entity_public_id?: string | null
  actor_email?: string | null
  request_id?: string | null
  summary?: AdminAuditLogSummary | null
  created_at: string
}

export interface AdminAuditLogListResponse {
  results: AdminAuditLogEntry[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export type AdminAuditLogFilters = {
  /**
   * Serialized action list, e.g. `order.status.overridden,order.refund.updated`.
   * A single value still matches exactly one action.
   */
  action?: string
  /** Serialized entity type list, e.g. `order,product`. */
  entity_type?: string
  /** Free-text match over actor email, entity id, or entity public id. */
  search?: string
};

export type ListAdminAuditLogsParams = AdminAuditLogFilters & {
  page: number
  limit: number
};
