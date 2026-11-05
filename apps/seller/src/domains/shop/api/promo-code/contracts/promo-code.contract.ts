import type { z } from 'zod';
import type { components, paths } from '@arc/schemas/api/generated/openapi';
import type { createPromoCodeFormSchema } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

export type ShopPromoCode = components['schemas']['ShopPromoCodeResponseDto'];
export type CreateShopPromoCodeRequestBody = components['schemas']['CreateShopPromoCodeDto'];
export type CreatePromoCodeFormValues = z.infer<typeof createPromoCodeFormSchema>;
export type CreateShopPromoCodeResponse = components['schemas']['ShopPromoCodeEnvelopeResponseDto'];
export type ListShopPromoCodesRequest =
  paths['/v1/shops/{shop_id}/promo-codes']['get']['parameters']['query'];
export type ListShopPromoCodesResponse = components['schemas']['ShopPromoCodeListResponseDto'];
export type ShopPromoCodeStopResponse = components['schemas']['ShopPromoCodeEnvelopeResponseDto'];
export type BulkStopShopPromoCodesRequest = components['schemas']['BulkStopShopPromoCodesDto'];
export type BulkStopShopPromoCodesResponse = components['schemas']['ShopPromoCodeStopListResponseDto'];
