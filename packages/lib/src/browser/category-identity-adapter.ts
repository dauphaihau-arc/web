import {
  createCategoryIdentityGuard,
  isCategoryIdentityGenerationMismatchError,
  type CategoryIdentityGuard,
  type CategoryStateStores,
} from './category-identity'

export const CATEGORY_IDENTITY_GENERATION_HEADER = 'x-category-identity-generation'

export type CategoryIdentityClientAdapterOptions = {
  /** Category identity generation this client bundle speaks. */
  clientVersion: string

  /** Probes the API's advertised generation; null when it cannot be confirmed. */
  fetchServerVersion: () => Promise<string | null>
  reload: () => void
  stores: CategoryStateStores
}

export type CategoryIdentityClientAdapter = {
  generation: string
  generationHeader: string
  guard: CategoryIdentityGuard
  isGenerationMismatch: (error: unknown) => boolean
}

/**
 * Shared client-side adapter for the staged category identity cutover. Owns the
 * generation header, the fail-closed guard, and the backend-mismatch detection
 * so storefront and seller stay identical; apps only supply the Nuxt-specific
 * probe and storage bindings.
 */
export function createCategoryIdentityClientAdapter(
  options: CategoryIdentityClientAdapterOptions,
): CategoryIdentityClientAdapter {
  const guard = createCategoryIdentityGuard({
    clientVersion: options.clientVersion,
    fetchServerVersion: options.fetchServerVersion,
    reload: options.reload,
    stores: options.stores,
  })

  return {
    generation: options.clientVersion,
    generationHeader: CATEGORY_IDENTITY_GENERATION_HEADER,
    guard,
    isGenerationMismatch: isCategoryIdentityGenerationMismatchError,
  }
}
