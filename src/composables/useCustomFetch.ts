import dayjs from 'dayjs';
import type { SearchParameters } from 'ofetch';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { StatusCodes } from 'http-status-codes';
import { LOCAL_STORAGE_KEYS } from '~/config/enums/local-storage-keys';
import { RESOURCES } from '~/config/enums/resources';
import { clearExpTokensInLS, setExpTokensToLS } from '~/services/auth';
import { isBackendWakeUpError, useBackendStatus } from '~/composables/useBackendStatus';

type RequestBehavior = {
  retryOnWakeUp?: boolean
};

const baseCustomFetch = async <
  DefaultT = unknown,
  DefaultR extends NitroFetchRequest = NitroFetchRequest,
  T = DefaultT,
  R extends NitroFetchRequest = DefaultR,
  O extends NitroFetchOptions<R> = NitroFetchOptions<R>
>(
  url: R,
  options?: O
) => {
  const config = useRuntimeConfig();
  return $fetch<T>(url, {
    baseURL: `${config.public.apiBaseURL}/v${config.public.apiVersion}`,
    credentials: 'include',
    ...options,
  });
};

const requestWithWakeUpRecovery = async <T>(
  request: () => Promise<T>,
  behavior?: RequestBehavior
) => {
  const { markReady, markWaking, waitForBackend } = useBackendStatus();

  try {
    const response = await request();
    markReady();
    return response;
  }
  catch (error) {
    if (!behavior?.retryOnWakeUp || !isBackendWakeUpError(error)) {
      throw error;
    }

    markWaking();

    const isBackendReady = await waitForBackend();

    if (!isBackendReady) {
      throw error;
    }

    const response = await request();
    markReady();
    return response;
  }
};

const checkAccessAndRefreshToken = async () => {
  const refreshTokenExp = localStorage[LOCAL_STORAGE_KEYS.REFRESH_TOKEN_EXP];
  const accessTokenExp = localStorage[LOCAL_STORAGE_KEYS.ACCESS_TOKEN_EXP];
  if (!refreshTokenExp && !accessTokenExp) {
    return;
  }
  const isRefreshTokenValid = dayjs(refreshTokenExp).isValid();
  const isRefreshTokenExpired = dayjs().isAfter(dayjs(refreshTokenExp));
  if (!isRefreshTokenValid || isRefreshTokenExpired) {
    clearExpTokensInLS();
    return;
  }
  const isAccessTokenExpired = dayjs().isAfter(dayjs(accessTokenExp));
  if (isAccessTokenExpired) {
    await requestWithWakeUpRecovery(
      () => baseCustomFetch(`${RESOURCES.AUTH}/refresh-tokens`, {
        method: 'post',
        onResponse: ({ response }) => {
          if (response.status === StatusCodes.OK) {
            setExpTokensToLS();
          }
          else {
            clearExpTokensInLS();
            throw new Error('Refresh token failed');
          }
        },
      }),
      { retryOnWakeUp: true }
    );
  }
};

type TBody = NitroFetchOptions<NitroFetchRequest>['body'];
type TOptions = NitroFetchOptions<NitroFetchRequest>;

export const useCustomFetch = {
  get: async <T>(
    url: string,
    params?: SearchParameters,
    option?: TOptions,
    behavior?: RequestBehavior
  ) => {
    await checkAccessAndRefreshToken();
    return await requestWithWakeUpRecovery(
      () => baseCustomFetch<T>(url, { method: 'get', params, ...option }),
      { retryOnWakeUp: true, ...behavior }
    );
  },

  post: async <T>(
    url: string,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior
  ) => {
    await checkAccessAndRefreshToken();
    return await requestWithWakeUpRecovery(
      () => baseCustomFetch<T>(url, { method: 'post', body, ...option }),
      behavior
    );
  },

  put: async <T>(
    url: string,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior
  ) => {
    await checkAccessAndRefreshToken();
    return await requestWithWakeUpRecovery(
      () => baseCustomFetch<T>(url, { method: 'put', body, ...option }),
      behavior
    );
  },

  patch: async <T>(
    url: string,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior
  ) => {
    await checkAccessAndRefreshToken();
    return await requestWithWakeUpRecovery(
      () => baseCustomFetch<T>(url, { method: 'patch', body, ...option }),
      behavior
    );
  },

  delete: async <T>(
    url: string,
    params?: SearchParameters,
    body?: TBody,
    option?: TOptions,
    behavior?: RequestBehavior
  ) => {
    await checkAccessAndRefreshToken();
    return await requestWithWakeUpRecovery(
      () => baseCustomFetch<T>(url, {
        method: 'delete', params, body, ...option,
      }),
      behavior
    );
  },
};
