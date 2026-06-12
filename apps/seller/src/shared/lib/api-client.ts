import { createApiClient } from '@arc/lib';
import { RESOURCES } from '@arc/enums/resources';
import { isBackendWakeUpError, useBackendStatus } from '~/shared/composables/use-backend-status';
import { clearExpTokensInLS } from '~/shared/server-state/auth/token-storage';

function getApiBaseURL() {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL}/v${config.public.apiVersion}`;
}

export const apiClient = createApiClient({
  getBaseURL: getApiBaseURL,
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
