import type { ShopOrderDetailResponse } from '~/shared/api/shop/order/contracts/order.contract';

export type ShopOrder = NonNullable<ShopOrderDetailResponse['order']>;
export type ShopOrderTimelineEvent = ShopOrderDetailResponse['timeline'][number];
