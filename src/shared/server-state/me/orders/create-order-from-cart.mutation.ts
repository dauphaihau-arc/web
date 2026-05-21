import { meOrdersApi } from '~/shared/api/me/order/me-orders.api';
import type { CreateOrderFromCartRequest } from '~/shared/api/me/order/create-order-from-cart';

export function useCreateOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateOrderFromCartRequest) => {
      return meOrdersApi.createFromCart(body);
    },
  });
}
