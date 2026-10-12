import {
  CategoryIdentityMismatchError,
  CategoryIdentityUnavailableError,
  createApiClient,
  isBackendWakeUpError,
} from '@arc/lib';
import { RESOURCES } from '@arc/enums/resources';
import { getRequestMarketHeaders } from '~/domains/market/stores/request-market-context';
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
  getDefaultHeaders: () => ({
    ...(getRequestMarketHeaders() ?? {}),
    [CATEGORY_IDENTITY_GENERATION_HEADER]: resolveCategoryIdentityGeneration(),
  }),
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
