import { consumePostAuthRedirect } from './post-auth-redirect'
import type { RegisterRequest } from '~/shared/api/auth/contracts/register.contract'
import { authApi } from '~/shared/api/auth/auth.api'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { useMergeCart } from '~/shared/server-state/cart/merge-cart.mutation'

export function useRegister() {
  const queryClient = useQueryClient()
  const { refetch: getCart } = useGetCart()
  const { mutateAsync: mergeCart } = useMergeCart()

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (body: RegisterRequest) => {
      return authApi.register(body)
    },
    onSuccess: async (data) => {
      if (data?.user) {
        queryClient.setQueryData(['current-user'], { user: data.user })
        await mergeCart()
        await getCart()

        const redirectPath = consumePostAuthRedirect()
        if (redirectPath) {
          navigateTo(redirectPath)
        }
      }
    },
  })
}
