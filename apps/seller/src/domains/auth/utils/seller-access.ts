export {
  hasAdminRole,
  hasSellerAccess,
} from '@arc/schemas/api/auth/portal-access.schema';

export class SellerAccessRequiredError extends Error {
  constructor() {
    super('Seller access is required');
    this.name = 'SellerAccessRequiredError';
  }
}
