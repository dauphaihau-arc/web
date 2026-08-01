import { shopProductApi } from '~/domains/shop/api/product/product.api';
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';
import type { IssueProductImageUploadUrlRequest } from '~/domains/shop/api/product/contracts/read.contract';

export function useIssueProductImageUploadUrl() {
  const { data: dataMyShop, refetch } = useGetMyShop();
  return useMutation({
    mutationKey: ['issue-product-image-upload-url'],
    mutationFn: async (input: IssueProductImageUploadUrlRequest) => {
      const shopId =
        dataMyShop.value?.id ??
        (await refetch({ throwOnError: true })).data?.id;

      return shopProductApi.issueImageUploadUrl(shopId!, input);
    },
  });
}
