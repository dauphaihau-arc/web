import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { productApi } from '~/shared/api/product/product.api';
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract';

export function useGetDetailProductBySlug(
  shopSlug: string,
  productSlug: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!shopSlug && !!productSlug,
    queryKey: ['get-detail-product-by-slug', shopSlug, productSlug],
    queryFn: () => {
      return productApi.getDetailBySlug(shopSlug, productSlug, options) as Promise<GetDetailProductBySlugResponse>;
    },
  });
}
