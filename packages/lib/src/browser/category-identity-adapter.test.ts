import { describe, expect, it, vi } from 'vitest'
import {
  CATEGORY_IDENTITY_GENERATION_HEADER,
  createCategoryIdentityClientAdapter,
} from './category-identity-adapter'

function createStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('createCategoryIdentityClientAdapter', () => {
  it('exposes the generation header and detects backend mismatches', () => {
    const adapter = createCategoryIdentityClientAdapter({
      clientVersion: '2',
      fetchServerVersion: async () => '2',
      reload: vi.fn(),
      stores: { session: createStorage() },
    })

    expect(adapter.generation).toBe('2')
    expect(adapter.generationHeader).toBe(CATEGORY_IDENTITY_GENERATION_HEADER)
    expect(adapter.isGenerationMismatch({ data: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' } })).toBe(true)
    expect(adapter.isGenerationMismatch({ response: { data: { code: 'CATEGORY_IDENTITY_GENERATION_MISMATCH' } } })).toBe(true)
    expect(adapter.isGenerationMismatch({ data: { code: 'OTHER' } })).toBe(false)
    expect(adapter.isGenerationMismatch({ response: { status: 409, data: { code: 'SLOT_CONFLICT' } } })).toBe(false)
    expect(adapter.isGenerationMismatch(new Error('network'))).toBe(false)
  })

  it('delegates compatibility to the shared guard', async () => {
    const adapter = createCategoryIdentityClientAdapter({
      clientVersion: '1',
      fetchServerVersion: async () => '2',
      reload: vi.fn(),
      stores: { session: createStorage() },
    })

    await expect(adapter.guard.ensureCompatible()).resolves.toBe('incompatible')
  })
})
