import type { components, paths } from '@arc/schemas/api/generated/openapi';

/**
 * A platform operator's view of the shop directory. The list is gated by
 * `orders.manage`, because an operator needs the shop a customer's order
 * belongs to, not seller shop management.
 */
export type AdminShopListEntry = components['schemas']['AdminShopListEntryResponseDto'];

export type AdminShopListResponse = components['schemas']['AdminShopListResponseDto'];

export type ListAdminShopsParams = paths['/v1/admin/shops']['get']['parameters']['query'];
