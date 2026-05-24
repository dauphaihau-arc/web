import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status'
import { setPostAuthRedirect } from '~/shared/server-state/auth/post-auth-redirect'
import { clearExpTokensInLS } from '~/shared/server-state/auth/token-storage'
import { hasSellerAccess } from '~/shared/utils/seller-access'

export default defineNuxtRouteMiddleware(async (to) => {
  const queryClient = useQueryClient()
  const { data, refetch } = useGetCurrentUser()

  if (hasSellerAccess(data.value?.user)) {
    return
  }

  if (data.value?.user) {
    queryClient.setQueryData(['current-user'], { user: null })
    clearExpTokensInLS()
    setPostAuthRedirect(to.fullPath)
    return navigateTo(routes.login())
  }

  const hasAccessToken = !!localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP]

  if (!hasAccessToken) {
    setPostAuthRedirect(to.fullPath)
    return navigateTo(routes.login())
  }

  try {
    const response = await refetch({ throwOnError: true })

    if (!hasSellerAccess(response.data?.user)) {
      queryClient.setQueryData(['current-user'], { user: null })
      clearExpTokensInLS()
      setPostAuthRedirect(to.fullPath)
      return navigateTo(routes.login())
    }
  }
  catch (error) {
    if (isBackendWakeUpError(error)) {
      void refetch()
      return
    }

    setPostAuthRedirect(to.fullPath)
    return navigateTo(routes.login())
  }
})
