import { shopApi } from '~/domains/shop/api/shop.api';

export function useGetMyShop() {
  return useQuery({
    enabled: true,
    queryKey: ['my-shop'],
    queryFn: () => {
      return shopApi.getMine();
    },
  });
}
