import {
  CategoryIdentityMismatchError,
  CategoryIdentityUnavailableError,
  createApiClient,
  isBackendWakeUpError,
} from '@arc/lib';
import { RESOURCES } from '@arc/enums/resources';
import {
  CATEGORY_IDENTITY_GENERATION_HEADER,
  getCategoryIdentityGuard,
  handleCategoryIdentityRequestError,
  isCategoryBearingApiPath,
  resolveCategoryIdentityGeneration,
} from '~/domains/_shared/category-identity-guard';

function getApiBaseURL() {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}`;
}

export const apiClient = createApiClient({
  getBaseURL: getApiBaseURL,
  // Server requests reach the API through the Nitro proxy, and a plain $fetch does
  // not carry the incoming request's headers; without this the SSR pass cannot see
  // the session and every server-side guard decides as a guest.
  getDefaultHeaders: () => {
    const headers: Record<string, string | undefined> = {
      [CATEGORY_IDENTITY_GENERATION_HEADER]: resolveCategoryIdentityGeneration(),
    };

    if (!import.meta.client) {
      const { cookie } = useRequestHeaders(['cookie']);

      if (cookie) {
        headers.cookie = cookie;
      }
    }

    return headers;
  },
  // A category-bearing request must never be retried inside the transport: a
  // 409 generation rejection has to surface once, not be replayed by ofetch.
  shouldRetryTransport: url => !isCategoryBearingApiPath(url),
  isWakeUpError: isBackendWakeUpError,
  lifecycle: {
    markWaking: () => useBackendStatus().markWaking(),
    waitForBackend: () => useBackendStatus().waitForBackend(),
  },
  refreshSession: {
    url: `${RESOURCES.AUTH}/refresh`,
  },
  guardRequest: async (url) => {
    if (!isCategoryBearingApiPath(url)) {
      return;
    }

    const guard = getCategoryIdentityGuard();

    if (!guard) {
      return;
    }

    const status = await guard.ensureCompatible();

    if (status === 'incompatible') {
      throw new CategoryIdentityMismatchError();
    }

    if (status === 'unavailable') {
      throw new CategoryIdentityUnavailableError();
    }
  },
  onRequestError: handleCategoryIdentityRequestError,
});
