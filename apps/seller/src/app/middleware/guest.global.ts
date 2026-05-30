import { routePaths, routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { hasSellerAccess } from '~/shared/utils/seller-access'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { refetch, data } = useGetCurrentUser()

  if (!data.value?.user) {
    void refetch()
  }

  if (data.value?.user && !hasSellerAccess(data.value.user)
    && (to.path === routePaths.login || to.path === routePaths.register)) {
    return navigateTo(routes.sell())
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.reset) {
    return navigateTo(routes.home())
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.login) {
    return navigateTo(routes.products())
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.register) {
    return navigateTo(routes.products())
  }

  if (hasSellerAccess(data.value?.user) && to.path === routePaths.sell) {
    return navigateTo(routes.products())
  }
})
