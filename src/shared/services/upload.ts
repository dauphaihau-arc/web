import type { ResponseGetPresignedUrlData } from '~/shared/types/upload';
import { RESOURCES } from '~/shared/config/enums/resources';
import { useGetMyShop } from '~/shared/services/shop';
import type { Product } from '~/shared/types/product';

export function useIssueProductImageUploadUrl() {
  const { data: dataMyShop, refetch } = useGetMyShop();
  return useMutation({
    mutationKey: ['issue-product-image-upload-url'],
    mutationFn: async (input: {
      productId: Product['id']
      contentType: string
      assetType?: 'original'
    }) => {
      const shopId = dataMyShop.value?.id ?? (await refetch({ throwOnError: true })).data?.id;

      return useCustomFetch.post<ResponseGetPresignedUrlData>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${input.productId}/image-uploads`,
        {
          contentType: input.contentType,
          assetType: input.assetType ?? 'original',
        }
      );
    },
  });
}
