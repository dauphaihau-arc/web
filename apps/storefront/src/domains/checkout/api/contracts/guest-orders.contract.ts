import type { operations } from '@arc/schemas/api/generated/openapi';
import type { OrderShopResource } from '~/domains/me/api/order/contracts/order.contract';

export type GetGuestOrderLookupRequest = NonNullable<
  operations['Checkout_lookupGuestOrders']['parameters']['query']
>;
/**
 * The contract models this endpoint as `CheckoutOrderListResponseDto`, whose order
 * shops omit `sale_discount_minor` and make the totals optional. The guest order
 * page renders the same order-shop cards as the signed-in order list, so the shape
 * those cards expect is kept; the contract gap is reported.
 */
export type GetGuestOrderLookupResponse = { order_shops: OrderShopResource[] };
