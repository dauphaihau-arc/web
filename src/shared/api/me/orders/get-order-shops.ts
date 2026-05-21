import type { OrderShopResource } from './orders.shared';
import type { RequestGetListParams } from '~/shared/contracts/common';

export type GetOrderShopsRequest = RequestGetListParams;

export type GetOrderShopsResponse = {
  order_shops: OrderShopResource[]
};
