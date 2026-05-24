import { resolveMyShopId } from '../resolve-my-shop-id'
import { shopProductApi } from '~/shared/api/shop/product/product.api'
import type { CreateDraftProductRequest } from '~/shared/api/shop/product/contracts/create-draft.contract'

export function useShopCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['shop-create-product'],
    mutationFn: async (body: CreateDraftProductRequest) => {
      const shopId = await resolveMyShopId(queryClient)
      return shopProductApi.createDraft(shopId, body)
    },
  })
}
