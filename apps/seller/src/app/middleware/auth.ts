import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status'
import { setPostAuthRedirect } from '~/shared/server-state/auth/post-auth-redirect'

export default defineNuxtRouteMiddleware(async (to) => {
  const { data, refetch } = useGetCurrentUser()

  if (data.value?.user) {
    return
  }

  const hasAccessToken = !!localStorage[LocalStorageKeys.ACCESS_TOKEN_EXP]

  if (!hasAccessToken) {
    setPostAuthRedirect(to.fullPath)
    return navigateTo(routes.login())
  }

  try {
    const response = await refetch({ throwOnError: true })

    if (!response.data?.user) {
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
