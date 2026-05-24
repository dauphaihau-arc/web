import type { AuthUser } from '~/shared/api/auth/contracts/auth-user.contract'

const SELLER_PERMISSION = 'shops.manage'

export function hasSellerAccess(user?: AuthUser | null) {
  return user?.permissions?.includes(SELLER_PERMISSION) ?? false
}
