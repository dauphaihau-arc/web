import type { ShopOrderDetailResponse } from '~/domains/shop/api/order/contracts/order.contract';

export type ShopOrder = NonNullable<ShopOrderDetailResponse['order']>;
export type ShopOrderTimelineEvent = ShopOrderDetailResponse['timeline'][number];
