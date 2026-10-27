import { describe, expect, it } from 'vitest'
import { hasAdminRole, hasCustomerAccess, hasSellerAccess } from './portal-access.schema'

describe('portal access', () => {
  it('admits admin, super admin and finance sessions to the admin app', () => {
    expect(hasAdminRole({ roles: ['admin'] })).toBe(true)
    expect(hasAdminRole({ roles: ['super_admin'] })).toBe(true)
    expect(hasAdminRole({ roles: ['finance'] })).toBe(true)
  })

  it('keeps finance out of seller and storefront access', () => {
    expect(hasSellerAccess({ roles: ['finance'] })).toBe(false)
    expect(hasCustomerAccess({ roles: ['finance'] })).toBe(false)
  })

  it('rejects customer and seller sessions from the admin app', () => {
    expect(hasAdminRole({ roles: ['customer'] })).toBe(false)
    expect(hasAdminRole({ roles: ['seller'] })).toBe(false)
    expect(hasAdminRole(null)).toBe(false)
  })
})
