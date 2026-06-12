const SELLER_PERMISSION = 'shops.manage';

type SellerAccessUser = {
  permissions?: string[]
} | null | undefined;

export function hasSellerAccess(user?: SellerAccessUser) {
  return user?.permissions?.includes(SELLER_PERMISSION) ?? false;
}
