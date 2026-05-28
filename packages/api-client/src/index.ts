import type { SearchParameters } from 'ofetch'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export type RequestBehavior = {
  retryOnWakeUp?: boolean
  retryOnUnauthorized?: boolean
}

type RequestLifecycle = {
  markReady?: () => void
  markWaking?: () => void
  waitForBackend?: () => Promise<boolean>
}

type RefreshSessionConfig = {
  url: string
  options?: NitroFetchOptions<NitroFetchRequest>
}

export type CreateApiClientConfig = {
  getBaseURL: () => string
  getDefaultHeaders?: () => Record<string, string | undefined>
  clearUnauthorizedState?: () => void
  isWakeUpError?: (error: unknown) => boolean
  lifecycle?: RequestLifecycle
  refreshSession?: RefreshSessionConfig
}

export function getStatusCode(error: unknown) {
  const fetchError = error as {
    response?: { status?: number }
    statusCode?: number
    status?: number
  }

  return fetchError.response?.status ?? fetchError.statusCode ?? fetchError.status
}

export function isUnauthorizedError(error: unknown) {
  return getStatusCode(error) === 401
}

export function createApiClient(config: CreateApiClientConfig) {
  const resolveHeaders = (
    options?: NitroFetchOptions<NitroFetchRequest>,
  ) => {
    if (options?.baseURL !== undefined) {
      return options.headers
    }

    const defaultHeaders = config.getDefaultHeaders?.()

    if (!defaultHeaders) {
      return options?.headers
    }

    const headers = new Headers(options?.headers)

    for (const [key, value] of Object.entries(defaultHeaders)) {
      if (value !== undefined) {
        headers.set(key, value)
      }
    }

    return headers
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
    return $fetch<T>(url, {
      baseURL: config.getBaseURL(),
      credentials: 'include',
      ...options,
      headers: resolveHeaders(options),
    })
  }

  const requestWithWakeUpRecovery = async <T>(
    request: () => Promise<T>,
    behavior?: RequestBehavior,
  ) => {
    try {
      const response = await request()
      config.lifecycle?.markReady?.()
      return response
    }
    catch (error) {
      if (getStatusCode(error) === 401) {
        config.clearUnauthorizedState?.()
      }

      if (
        !behavior?.retryOnWakeUp
        || !config.isWakeUpError?.(error)
        || !config.lifecycle?.waitForBackend
      ) {
        throw error
      }

      config.lifecycle.markWaking?.()

      const isBackendReady = await config.lifecycle.waitForBackend()

      if (!isBackendReady) {
        throw error
      }

      const response = await request()
      config.lifecycle.markReady?.()
      return response
    }
  }

  const refreshSession = async () => {
    if (!config.refreshSession) {
      throw new Error('Refresh session is not configured')
    }

    await requestWithWakeUpRecovery(
      () => baseCustomFetch(config.refreshSession!.url, {
        method: 'post',
        ...config.refreshSession!.options,
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
      if (!isUnauthorizedError(error) || behavior?.retryOnUnauthorized === false) {
        throw error
      }

      try {
        await refreshSession()
        return await requestWithWakeUpRecovery(request, behavior)
      }
      catch {
        config.clearUnauthorizedState?.()
        throw error
      }
    }
  }

  type TBody = NitroFetchOptions<NitroFetchRequest>['body']
  type TOptions = NitroFetchOptions<NitroFetchRequest>

  return {
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
}
