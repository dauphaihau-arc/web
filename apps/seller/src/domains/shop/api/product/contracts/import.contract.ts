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
