import {
  createApiClient,
  isBackendWakeUpError,
} from '@arc/lib';
import { RESOURCES } from '@arc/enums/resources';

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
    // The API scopes session cookies by portal; the admin portal declares itself
    // so it receives and refreshes the admin cookie pair.
    const headers: Record<string, string | undefined> = {
      'x-auth-portal': 'admin',
    };

    if (!import.meta.client) {
      const { cookie } = useRequestHeaders(['cookie']);

      if (cookie) {
        headers.cookie = cookie;
      }
    }

    return headers;
  },
  isWakeUpError: isBackendWakeUpError,
  lifecycle: {
    markWaking: () => useBackendStatus().markWaking(),
    waitForBackend: () => useBackendStatus().waitForBackend(),
  },
  refreshSession: {
    url: `${RESOURCES.AUTH}/refresh`,
    options: {
      headers: { 'x-auth-portal': 'admin' },
    },
  },
});
