import type { z } from 'zod';
import type { components, paths } from '@arc/schemas/api/generated/openapi';
import type { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion';
import type { createSaleFormSchema } from '~/domains/shop/schemas/sale/create-sale-form.schema';

/**
 * The contract types `status` and `product_scope` as plain strings. The seller
 * UI indexes them by `PromotionStatus` and `PromotionProductScope`, so they are
 * narrowed back to their wire unions.
 */
export type ShopSale = Omit<
  components['schemas']['ShopSaleResponseDto'],
  'status' | 'product_scope'
> & {
  status: PromotionStatus
  product_scope: PromotionProductScope
};
export type CreateShopSaleRequestBody = components['schemas']['CreateShopSaleDto'];
export type CreateSaleFormValues = z.infer<typeof createSaleFormSchema>;
export type CreateShopSaleResponse = Omit<
  components['schemas']['ShopSaleEnvelopeResponseDto'],
  'sale'
> & { sale: ShopSale };
export type ListShopSalesRequest = paths['/v1/shops/{shop_id}/sales']['get']['parameters']['query'];
export type ListShopSalesResponse = Omit<
  components['schemas']['ShopSaleListResponseDto'],
  'results'
> & { results: ShopSale[] };
export type ShopSaleStopResponse = Omit<
  components['schemas']['ShopSaleEnvelopeResponseDto'],
  'sale'
> & { sale: ShopSale };
export type BulkStopShopSalesRequest = components['schemas']['BulkStopShopSalesDto'];
export type BulkStopShopSalesResponse = Omit<
  components['schemas']['ShopSaleStopListResponseDto'],
  'results'
> & { results: ShopSale[] };
