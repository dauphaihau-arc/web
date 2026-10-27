export type AuthPortal = 'storefront' | 'seller' | 'admin'

type PortalAccessUser = {
  roles?: string[]
} | null | undefined

const ADMIN_PORTAL_ROLE_KEYS: readonly string[] = ['admin', 'super_admin', 'finance']

export function hasAdminRole(user?: PortalAccessUser) {
  return user?.roles?.some(role => ADMIN_PORTAL_ROLE_KEYS.includes(role)) ?? false
}

export function hasCustomerAccess(user?: PortalAccessUser) {
  return !hasAdminRole(user)
    && (user?.roles?.includes('customer') || user?.roles?.includes('seller') || false)
}

export function hasSellerAccess(user?: PortalAccessUser) {
  return !hasAdminRole(user) && (user?.roles?.includes('seller') ?? false)
}
