import { resolveMyShopId } from '../resolve-my-shop-id'
import { toastCustom } from '~/shared/config/toast'
import { shopProductApi } from '~/shared/api/shop/product/product.api'

export function useShopDeleteProduct() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationKey: ['shop-delete-product'],
    mutationFn: async (id: string) => {
      const shopId = await resolveMyShopId(queryClient)
      return shopProductApi.remove(shopId, id)
    },
    onSuccess() {
      toast.add({
        ...toastCustom.success,
        title: 'Delete product success',
      })
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Delete product failed',
      })
    },
  })
}
