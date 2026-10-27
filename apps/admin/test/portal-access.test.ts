import { describe, expect, it } from 'vitest';
import {
  hasAdminRole,
  hasCustomerAccess,
  hasSellerAccess,
} from '@arc/schemas/api/auth/portal-access.schema';

describe('portal access predicates', () => {
  it('grants admin portal access to the admin role', () => {
    expect(hasAdminRole({ roles: ['admin'] })).toBe(true);
  });

  it('grants admin portal access to the super_admin role', () => {
    expect(hasAdminRole({ roles: ['super_admin'] })).toBe(true);
  });

  it('grants admin portal access when both platform roles are present', () => {
    expect(hasAdminRole({ roles: ['admin', 'super_admin'] })).toBe(true);
  });

  it('denies admin portal access to sellers and customers', () => {
    expect(hasAdminRole({ roles: ['seller'] })).toBe(false);
    expect(hasAdminRole({ roles: ['customer'] })).toBe(false);
    expect(hasAdminRole({ roles: ['customer', 'seller'] })).toBe(false);
  });

  it('denies admin portal access to empty and missing sessions', () => {
    expect(hasAdminRole({ roles: [] })).toBe(false);
    expect(hasAdminRole({})).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
  });

  it('keeps seller access closed to both platform roles', () => {
    expect(hasSellerAccess({ roles: ['seller'] })).toBe(true);
    expect(hasSellerAccess({ roles: ['admin'] })).toBe(false);
    expect(hasSellerAccess({ roles: ['super_admin'] })).toBe(false);
  });

  it('keeps customer access closed to both platform roles', () => {
    expect(hasCustomerAccess({ roles: ['customer'] })).toBe(true);
    expect(hasCustomerAccess({ roles: ['admin'] })).toBe(false);
    expect(hasCustomerAccess({ roles: ['super_admin'] })).toBe(false);
  });
});
