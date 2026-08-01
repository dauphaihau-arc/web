import { createApiClient, isBackendWakeUpError } from '@arc/lib';
import { RESOURCES } from '@arc/enums/resources';
import { getRequestMarketHeaders } from '~/domains/market/stores/request-market-context';
import { clearExpTokensInLS } from '~/domains/auth/utils/token-storage';

function getApiBaseURL() {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}`;
}

export const apiClient = createApiClient({
  getBaseURL: getApiBaseURL,
  getDefaultHeaders: getRequestMarketHeaders,
  clearUnauthorizedState: clearExpTokensInLS,
  isWakeUpError: isBackendWakeUpError,
  lifecycle: {
    markReady: () => useBackendStatus().markReady(),
    markWaking: () => useBackendStatus().markWaking(),
    waitForBackend: () => useBackendStatus().waitForBackend(),
  },
  refreshSession: {
    url: `${RESOURCES.AUTH}/refresh`,
  },
});
