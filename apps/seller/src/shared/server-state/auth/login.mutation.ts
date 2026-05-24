import { setExpTokensToLS } from './token-storage'
import { consumePostAuthRedirect } from './post-auth-redirect'
import type { LoginRequest } from '~/shared/api/auth/contracts/login.contract'
import { authApi } from '~/shared/api/auth/auth.api'
import { routes } from '~/shared/navigation/routes'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['login'],
    mutationFn: (body: LoginRequest) => {
      return authApi.login(body)
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user })
        setExpTokensToLS(queryClient)

        const redirectPath = consumePostAuthRedirect()
        if (redirectPath) {
          await navigateTo(redirectPath)
          return
        }

        await navigateTo(routes.accountShopProducts())
      }
    },
  })
}
