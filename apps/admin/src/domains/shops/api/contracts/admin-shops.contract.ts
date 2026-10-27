/**
 * A platform operator's view of the shop directory. The list is gated by
 * `orders.manage`, because an operator needs the shop a customer's order
 * belongs to, not seller shop management.
 */
export interface AdminShopListEntry {
  /** Shop public id (`shop_…`), also the finance page's route param. */
  id: string
  shop_name: string
  slug: string
  status: string
  currency: string
  owner_email: string
  /** The owner's display name, or null when the owner never set one. */
  owner_name: string | null
  /** Number of products in the shop, regardless of status. */
  product_count: number
  /** ISO-8601 instant the shop was created. */
  created_at: string
}

export interface AdminShopListResponse {
  results: AdminShopListEntry[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export type ListAdminShopsParams = {
  page: number
  limit: number
  search?: string
};
