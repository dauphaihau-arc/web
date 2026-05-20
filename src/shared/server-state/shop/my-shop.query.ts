import { shopApi } from '~/shared/api/shop/shop.api';

export function useGetMyShop() {
  return useQuery({
    enabled: true,
    queryKey: ['my-shop'],
    queryFn: () => {
      return shopApi.getMine();
    },
  });
}
