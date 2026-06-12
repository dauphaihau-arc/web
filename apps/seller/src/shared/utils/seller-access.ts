export const SELLER_PERMISSION = 'shops.manage';

export class SellerAccessRequiredError extends Error {
  constructor() {
    super('Seller access is required');
    this.name = 'SellerAccessRequiredError';
  }
}

type SellerAccessUser = {
  permissions?: string[]
} | null | undefined;

export function hasSellerAccess(user?: SellerAccessUser) {
  return user?.permissions?.includes(SELLER_PERMISSION) ?? false;
}
