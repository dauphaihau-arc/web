import {
  CATEGORY_IDENTITY_GENERATION_HEADER,
  createCategoryIdentityClientAdapter,
  isCategoryBearingApiPath,
  type CategoryIdentityClientAdapter,
  type CategoryIdentityStatus,
} from '@arc/lib';
import { CATEGORY_IDENTITY_CONTRACT } from '@arc/enums/category';

let adapter: CategoryIdentityClientAdapter | undefined;

export { CATEGORY_IDENTITY_GENERATION_HEADER, isCategoryBearingApiPath };

const CATEGORY_IDENTITY_STATUS_KEY = 'category-identity-status';
const CATEGORY_IDENTITY_CHECKING_KEY = 'category-identity-checking';

/**
 * Category identity generation this client bundle speaks. Deployment may pin an
 * older generation at build time to produce a prepared pre-cutover bundle.
 */
export function resolveCategoryIdentityGeneration(): string {
  const config = useRuntimeConfig();

  return String(config.public.categoryIdentityContractVersion || CATEGORY_IDENTITY_CONTRACT.VERSION);
}

function resolveApiBaseUrl(): string {
  const config = useRuntimeConfig();

  return `${config.public.apiBaseURL}/v${config.public.apiVersion}`;
}

export function getCategoryIdentityAdapter(): CategoryIdentityClientAdapter | undefined {
  if (!import.meta.client || typeof sessionStorage === 'undefined') {
    return undefined;
  }

  adapter ??= createCategoryIdentityClientAdapter({
    clientVersion: resolveCategoryIdentityGeneration(),
    fetchServerVersion: async () => {
      try {
        const response = await $fetch<{ version?: string }>(
          `${resolveApiBaseUrl()}/categories/contract`,
          { timeout: 5000 },
        );

        return response?.version ?? null;
      }
      catch {
        return null;
      }
    },
    reload: () => window.location.reload(),
    stores: {
      session: sessionStorage,
      local: typeof localStorage === 'undefined' ? undefined : localStorage,
    },
  });

  return adapter;
}

export function getCategoryIdentityGuard() {
  return getCategoryIdentityAdapter()?.guard;
}

/** React to a backend generation rejection by latching incompatibility. */
export function handleCategoryIdentityRequestError(error: unknown): void {
  const current = getCategoryIdentityAdapter();

  if (current?.isGenerationMismatch(error)) {
    current.guard.handleServerMismatch();
  }
}

/**
 * Shared, request-isolated category identity state for the affected surfaces.
 *
 * `useState` keeps the value per-request on the server (no cross-user leakage)
 * and shared per browser tab on the client, so one in-flight mismatch — a
 * probe or a backend 409 seen by any surface — flips the blocked card on every
 * affected surface at once.
 */
export function useCategoryIdentityBlocked() {
  const status = useState<CategoryIdentityStatus>(CATEGORY_IDENTITY_STATUS_KEY, () => 'unavailable');
  const checking = useState<boolean>(CATEGORY_IDENTITY_CHECKING_KEY, () => false);
  const queryClient = import.meta.client ? useQueryClient() : undefined;

  if (import.meta.client) {
    const guard = getCategoryIdentityGuard();

    if (guard) {
      status.value = guard.status;
      onScopeDispose(guard.subscribe((next) => {
        status.value = next;
      }));
    }
  }

  return {
    status,
    blocked: computed(() => status.value === 'incompatible'),
    checking,
    checkForUpdate: async () => {
      const guard = getCategoryIdentityGuard();

      if (!guard || checking.value) {
        return;
      }

      checking.value = true;

      try {
        const result = await guard.recheck();

        if (result === 'compatible') {
          // The mismatch already invalidated the local category context, so a
          // category route cannot rebuild its query from the URL alone. Return
          // to a known-good page and refetch, rather than leaving a permanently
          // disabled query behind.
          await navigateTo('/');
          await queryClient?.refetchQueries();
        }
      }
      finally {
        checking.value = false;
        status.value = guard.status;
      }
    },
  };
}
