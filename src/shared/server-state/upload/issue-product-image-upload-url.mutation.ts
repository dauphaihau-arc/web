import { shopProductApi } from '~/shared/api/shop/product/product.api';
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query';
import type { Product } from '~/shared/models/product';

export function useIssueProductImageUploadUrl() {
  const { data: dataMyShop, refetch } = useGetMyShop();
  return useMutation({
    mutationKey: ['issue-product-image-upload-url'],
    mutationFn: async (input: {
      productId: Product['id']
      content_type: string
      asset_type?: 'original'
    }) => {
      const shopId =
        dataMyShop.value?.id ??
        (await refetch({ throwOnError: true })).data?.id;

      return shopProductApi.issueImageUploadUrl(shopId!, input);
    },
  });
}
