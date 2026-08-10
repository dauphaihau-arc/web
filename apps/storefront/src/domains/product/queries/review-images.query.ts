import { productApi } from '~/domains/product/api/product.api';
import type { GetPublicProductReviewImagesResponse } from '~/domains/product/api/contracts/product.contract';

export function useGetPublicProductReviewImages(
  shopSlug: string,
  productSlug: string,
  params?: MaybeRefOrGetter<{
    cursor?: string
    limit?: number
  } | undefined>,
) {
  return useQuery({
    enabled: !!shopSlug && !!productSlug,
    queryKey: computed(() => ['get-public-product-review-images', shopSlug, productSlug, toValue(params)]),
    queryFn: () => {
      return productApi.getReviewImages(shopSlug, productSlug, toValue(params)) as Promise<GetPublicProductReviewImagesResponse>;
    },
  });
}
