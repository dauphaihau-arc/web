import type { SearchParameters } from 'ofetch'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { RESOURCES } from '@arc/enums/resources'
import { clearExpTokensInLS } from '~/shared/server-state/auth/token-storage'
import { isBackendWakeUpError, useBackendStatus } from '~/shared/composables/use-backend-status'

type RequestBehavior = {
  retryOnWakeUp?: boolean
  retryOnUnauthorized?: boolean
}

function getStatusCode(error: unknown) {
  const fetchError = error as {
    response?: { status?: number }
    statusCode?: number
    status?: number
  }

  return fetchError.response?.status ?? fetchError.statusCode ?? fetchError.status
}

const baseCustomFetch = async <
  DefaultT = unknown,
  DefaultR extends NitroFetchRequest = NitroFetchRequest,
  T = DefaultT,
  R extends NitroFetchRequest = DefaultR,
  O extends NitroFetchOptions<R> = NitroFetchOptions<R>,
>(
  url: R,
  options?: O,
) => {
  const config = useRuntimeConfig()
  return $fetch<T>(url, {
    baseURL: `${config.public.apiBaseURL}/v${config.public.apiVersion}`,
    credentials: 'include',
    ...options,
  })
}

const requestWithWakeUpRecovery = async <T>(
  request: () => Promise<T>,
  behavior?: RequestBehavior,
) => {
  const { markReady, markWaking, waitForBackend } = useBackendStatus()

  try {
    const response = await request()
    markReady()
    return response
  }
  catch (error) {
    if (getStatusCode(error) === 401) {
      clearExpTokensInLS()
    }

    if (!behavior?.retryOnWakeUp || !isBackendWakeUpError(error)) {
      throw error
    }

    markWaking()

    const isBackendReady = await waitForBackend()

    if (!isBackendReady) {
      throw error
    }

    const response = await request()
    markReady()
    return response
  }
}

const refreshSession = async () => {
  await requestWithWakeUpRecovery(
    () => baseCustomFetch(`${RESOURCES.AUTH}/refresh`, {
      method: 'post',
    }),
    {
      retryOnWakeUp: true,
      retryOnUnauthorized: false,
    },
  )
}

const requestWithAuthRecovery = async <T>(
  request: () => Promise<T>,
  behavior?: RequestBehavior,
) => {
  try {
    return await requestWithWakeUpRecovery(request, behavior)
  }
  catch (error) {
    if (getStatusCode(error) !== 401 || behavior?.retryOnUnauthorized === false) {
      throw error
    }

    try {
      await refreshSession()
      return await requestWithWakeUpRecovery(request, behavior)
    }
    catch {
      clearExpTokensInLS()
      throw error
    }
  }
}

type TBody = NitroFetchOptions<NitroFetchRequest>['body']
type TOptions = NitroFetchOptions<NitroFetchRequest>

export const apiClient = {
  get: async <T>(
    url: string,
    params?: SearchParameters,
    option?: TOptions,
    behavior?: RequestBehavior,
  ) => {
    return await requestWithAuthRecovery(
      () => baseCustomFetch<T>(url, { method: 'get', params, ...option }),
      { retryOnWakeUp: true, retryOnUnauthorized: true, ...behavior },
    )
  },

  post: async <T>(
    url: string,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior,
  ) => {
    return await requestWithAuthRecovery(
      () => baseCustomFetch<T>(url, { method: 'post', body, ...option }),
      { retryOnUnauthorized: true, ...behavior },
    )
  },

  put: async <T>(
    url: string,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior,
  ) => {
    return await requestWithAuthRecovery(
      () => baseCustomFetch<T>(url, { method: 'put', body, ...option }),
      { retryOnUnauthorized: true, ...behavior },
    )
  },

  patch: async <T>(
    url: string,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior,
  ) => {
    return await requestWithAuthRecovery(
      () => baseCustomFetch<T>(url, { method: 'patch', body, ...option }),
      { retryOnUnauthorized: true, ...behavior },
    )
  },

  delete: async <T>(
    url: string,
    params?: SearchParameters,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior,
  ) => {
    return await requestWithAuthRecovery(
      () => baseCustomFetch<T>(url, {
        method: 'delete', params, body, ...option,
      }),
      { retryOnUnauthorized: true, ...behavior },
    )
  },
}
