import type { OrderShopResource } from './orders.shared';
import type { RequestGetListParams } from '~/shared/types/common';

export type GetOrderShopsRequest = RequestGetListParams;

export type GetOrderShopsResponse = {
  order_shops: OrderShopResource[]
};
