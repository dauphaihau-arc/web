import { describe, expect, it } from 'vitest'
import { CategoryIdentityMismatchError } from '../browser/category-identity'
import { isBackendWakeUpError } from './is-backend-wake-up-error'

describe('isBackendWakeUpError', () => {
  it('treats a status-less network error as a backend wake-up', () => {
    expect(isBackendWakeUpError(new Error('network'))).toBe(true)
  })

  it('treats 502/503/504 as a backend wake-up but not other statuses', () => {
    expect(isBackendWakeUpError({ response: { status: 503 } })).toBe(true)
    expect(isBackendWakeUpError({ response: { status: 409 } })).toBe(false)
  })

  it('never treats a category identity mismatch as a backend wake-up', () => {
    expect(isBackendWakeUpError(new CategoryIdentityMismatchError())).toBe(false)
    expect(isBackendWakeUpError({ code: 'CATEGORY_IDENTITY_MISMATCH' })).toBe(false)
  })
})
