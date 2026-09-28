import { createApiClient, isBackendWakeUpError } from '@arc/lib';
import { RESOURCES } from '@arc/enums/resources';
import { getRequestMarketHeaders } from '~/domains/market/stores/request-market-context';

function getApiBaseURL() {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}`;
}

export const apiClient = createApiClient({
  getBaseURL: getApiBaseURL,
  getDefaultHeaders: getRequestMarketHeaders,
  isWakeUpError: isBackendWakeUpError,
  lifecycle: {
    markWaking: () => useBackendStatus().markWaking(),
    waitForBackend: () => useBackendStatus().waitForBackend(),
  },
  refreshSession: {
    url: `${RESOURCES.AUTH}/refresh`,
  },
});
