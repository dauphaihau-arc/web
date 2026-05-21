import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { Shop } from '~/shared/models/shop';

export type GetOrderShopsByCheckoutSessionRequest = {
  session_id: string
  options?: NitroFetchOptions<NitroFetchRequest>
};

export type GetOrderShopsByCheckoutSessionResponse = {
  order_shops: {
    shop: Pick<Shop, 'shop_name'> & {
      slug: string
    }
  }[]
};
