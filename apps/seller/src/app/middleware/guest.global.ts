import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import { routePaths, routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { hasSellerAccess } from '~/shared/utils/seller-access'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { refetch, data } = useGetCurrentUser()

  if (!data.value?.user && localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP]) {
    void refetch()
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.reset) {
    return navigateTo(routes.home())
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.login) {
    return navigateTo(routes.accountShopProducts())
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.register) {
    return navigateTo(routes.accountShopProducts())
  }
})
