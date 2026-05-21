import type { Order } from '~/shared/models/order';
import type { Shop } from '~/shared/models/shop';

export type CreateOrderResponse = {
  checkout_session_url: string
  order_shops: {
    id: Order['id']
    shop: Pick<Shop, 'id' | 'shop_name'> & {
      slug: string
    }
  }[]
};
