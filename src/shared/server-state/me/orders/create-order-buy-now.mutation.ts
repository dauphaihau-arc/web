import { meOrdersApi } from '~/shared/api/me/orders/me-orders.api';
import type { CreateOrderForBuyNowRequest } from '~/shared/api/me/orders/create-order-buy-now';

export function useCreateOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateOrderForBuyNowRequest) => {
      return meOrdersApi.createForBuyNow(body);
    },
  });
}
