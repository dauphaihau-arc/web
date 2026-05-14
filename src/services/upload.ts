import type { ResponseGetPresignedUrlData } from '~/types/upload';
import { RESOURCES } from '~/config/enums/resources';
import { useGetMyShop } from '~/services/shop';
import type { Product } from '~/types/product';

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
