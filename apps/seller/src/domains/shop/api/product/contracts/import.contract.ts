/**
 * Blocked on the API contract: `ShopProductImport_startImport` and
 * `ShopProductImport_importDetail` declare their JSON body as
 * `Record<string, never>` and no import-status component schema exists, so
 * there is nothing to derive from yet. The shape below mirrors the API's
 * import record and stays hand-written until the contract publishes it.
 */
export type ShopProductImportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ShopProductImportResponse {
  id: string
  status: ShopProductImportStatus
  filename: string
  template_version: string
  total_rows: number
  processed_rows: number
  created_rows: number
  failed_rows: number
  unprocessed_rows: number
  error_message?: string
  completed_at?: string
  created_at: string
  updated_at: string
}
