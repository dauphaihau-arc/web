import { keepPreviousData } from '@tanstack/vue-query'
import { productApi } from '~/shared/api/product/product.api'
import type { GetPublicProductReviewsResponse } from '~/shared/api/product/contracts/product.contract'

export function useGetPublicProductReviews(
  shopSlug: string,
  productSlug: string,
  params?: MaybeRefOrGetter<{
    page?: number
    limit?: number
    sort?: 'all' | 'most_recent' | 'newest' | 'highest_rating' | 'lowest_rating'
    rating?: 1 | 2 | 3 | 4 | 5
    has_images?: boolean
    has_comment?: boolean
  } | undefined>,
) {
  return useQuery({
    enabled: !!shopSlug && !!productSlug,
    placeholderData: keepPreviousData,
    queryKey: computed(() => ['get-public-product-reviews', shopSlug, productSlug, toValue(params)]),
    queryFn: () => {
      return productApi.getReviews(shopSlug, productSlug, toValue(params)) as Promise<GetPublicProductReviewsResponse>
    },
  })
}
