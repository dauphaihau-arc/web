import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import { routePaths, routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { refetch, data } = useGetCurrentUser()

  if (!data.value?.user && localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP]) {
    void refetch()
  }

  if (data.value?.user && to.path === routePaths.reset) {
    return navigateTo(routes.home())
  }

  if (data.value?.user && to.path === routePaths.login) {
    return navigateTo(routes.accountShopProducts())
  }
})
