export { hasAdminRole } from '@arc/schemas/api/auth/portal-access.schema';

export class AdminAccessRequiredError extends Error {
  constructor() {
    super('Admin access is required');
    this.name = 'AdminAccessRequiredError';
  }
}
