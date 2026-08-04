export type AuthPortal = 'storefront' | 'seller' | 'admin'

type PortalAccessUser = {
  roles?: string[]
} | null | undefined

export function hasAdminRole(user?: PortalAccessUser) {
  return user?.roles?.includes('admin') ?? false
}

export function hasCustomerAccess(user?: PortalAccessUser) {
  return !hasAdminRole(user)
    && (user?.roles?.includes('customer') || user?.roles?.includes('seller') || false)
}

export function hasSellerAccess(user?: PortalAccessUser) {
  return !hasAdminRole(user) && (user?.roles?.includes('seller') ?? false)
}
