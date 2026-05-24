import { RESOURCES } from '@arc/enums/resources'
import { resolveMyShopId } from '../resolve-my-shop-id'
import { apiClient } from '~/shared/lib/api-client'

export function useShopSetProductAttributes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['shop-set-product-attributes'],
    mutationFn: async (body: {
      id: string
      attributes: {
        category_attribute_id: string
        selected_option_id?: string
        selected_text?: string
      }[]
    }) => {
      const shopId = await resolveMyShopId(queryClient)
      return apiClient.put<undefined>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${body.id}/attributes`,
        {
          attributes: body.attributes,
        },
      )
    },
  })
}
