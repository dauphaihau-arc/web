import type { AuthUser } from '~/shared/api/auth/contracts/auth-user.contract'

export const SELLER_PERMISSION = 'shops.manage'

export class SellerAccessRequiredError extends Error {
  constructor() {
    super('Seller access is required')
    this.name = 'SellerAccessRequiredError'
  }
}

export function hasSellerAccess(user?: AuthUser | null) {
  return user?.permissions?.includes(SELLER_PERMISSION) ?? false
}
