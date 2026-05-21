import { meOrdersApi } from '~/shared/api/me/order/me-orders.api';
import type { CreateOrderForBuyNowRequest } from '~/shared/api/me/order/contracts/order.contract';

export function useCreateOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateOrderForBuyNowRequest) => {
      return meOrdersApi.createForBuyNow(body);
    },
  });
}
