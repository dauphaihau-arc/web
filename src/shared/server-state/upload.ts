import type { ResponseGetPresignedUrlData } from '~/shared/types/upload';
import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
import { useGetMyShop } from '~/shared/server-state/shop';
import type { Product } from '~/shared/types/product';

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

      return apiClient.post<ResponseGetPresignedUrlData>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${input.productId}/image-uploads`,
        {
          content_type: input.content_type,
          asset_type: input.asset_type ?? 'original',
        }
      );
    },
  });
}
