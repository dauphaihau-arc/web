import type { z } from 'zod';
import type { components, paths } from '@arc/schemas/api/generated/openapi';
import type { createSaleFormSchema } from '~/domains/shop/schemas/sale/create-sale-form.schema';

export type ShopSale = components['schemas']['ShopSaleResponseDto'];
export type CreateShopSaleRequestBody = components['schemas']['CreateShopSaleDto'];
export type CreateSaleFormValues = z.infer<typeof createSaleFormSchema>;
export type CreateShopSaleResponse = components['schemas']['ShopSaleEnvelopeResponseDto'];
export type ListShopSalesRequest = paths['/v1/shops/{shop_id}/sales']['get']['parameters']['query'];
export type ListShopSalesResponse = components['schemas']['ShopSaleListResponseDto'];
export type ShopSaleStopResponse = components['schemas']['ShopSaleEnvelopeResponseDto'];
export type BulkStopShopSalesRequest = components['schemas']['BulkStopShopSalesDto'];
export type BulkStopShopSalesResponse = components['schemas']['ShopSaleStopListResponseDto'];
