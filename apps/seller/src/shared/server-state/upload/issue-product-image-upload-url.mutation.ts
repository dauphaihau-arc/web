import { shopProductApi } from '~/shared/api/shop/product/product.api'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'
import type { IssueProductImageUploadUrlRequest } from '~/shared/api/shop/product/contracts/read.contract'

export function useIssueProductImageUploadUrl() {
  const { data: dataMyShop, refetch } = useGetMyShop()
  return useMutation({
    mutationKey: ['issue-product-image-upload-url'],
    mutationFn: async (input: IssueProductImageUploadUrlRequest) => {
      const shopId
        = dataMyShop.value?.id
        ?? (await refetch({ throwOnError: true })).data?.id

      return shopProductApi.issueImageUploadUrl(shopId!, input)
    },
  })
}
