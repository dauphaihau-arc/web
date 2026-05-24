import type { QueryClient } from '@tanstack/vue-query'
import dayjs from 'dayjs'
import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import type { AuthClientConfigResponse } from '~/shared/api/auth/contracts/client-config.contract'
import { DEFAULT_AUTH_CLIENT_CONFIG } from '~/shared/utils/password-policy'

export const setExpTokensToLS = (queryClient?: Pick<QueryClient, 'getQueryData'>) => {
  const authClientConfig = queryClient?.getQueryData<AuthClientConfigResponse>(['auth', 'client-config'])
    ?? DEFAULT_AUTH_CLIENT_CONFIG

  localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP] = dayjs()
    .add(authClientConfig.session.access_token_ttl_seconds, 'seconds')
    .toISOString()
  localStorage[LocalStorageKeys.REFRESH_TOKEN_EXP] = dayjs()
    .add(authClientConfig.session.refresh_token_ttl_seconds, 'seconds')
    .toISOString()
}

export const clearExpTokensInLS = () => {
  localStorage.removeItem(LocalStorageKeys.REFRESH_TOKEN_EXP)
  localStorage.removeItem(LocalStorageKeys.ACCESS_TOKEN_EXP)
}
