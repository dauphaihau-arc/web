import type { z } from 'zod';
import type { components, paths } from '@arc/schemas/api/generated/openapi';
import type { PromotionProductScope, PromotionStatus } from '@arc/enums/promotion';
import type { createPromoCodeFormSchema } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';

/**
 * The contract types `status`, `product_scope` and `visibility` as plain
 * strings. The seller UI indexes them by `PromotionStatus` and
 * `PromotionProductScope`, so they are narrowed back to their wire unions.
 */
export type ShopPromoCode = Omit<
  components['schemas']['ShopPromoCodeResponseDto'],
  'status' | 'product_scope' | 'visibility'
> & {
  status: PromotionStatus
  product_scope: PromotionProductScope
  visibility: 'public' | 'code_only'
};
export type CreateShopPromoCodeRequestBody = components['schemas']['CreateShopPromoCodeDto'];
export type CreatePromoCodeFormValues = z.infer<typeof createPromoCodeFormSchema>;
export type CreateShopPromoCodeResponse = Omit<
  components['schemas']['ShopPromoCodeEnvelopeResponseDto'],
  'promo_code'
> & { promo_code: ShopPromoCode };
export type ListShopPromoCodesRequest =
  paths['/v1/shops/{shop_id}/promo-codes']['get']['parameters']['query'];
export type ListShopPromoCodesResponse = Omit<
  components['schemas']['ShopPromoCodeListResponseDto'],
  'results'
> & { results: ShopPromoCode[] };
export type ShopPromoCodeStopResponse = Omit<
  components['schemas']['ShopPromoCodeEnvelopeResponseDto'],
  'promo_code'
> & { promo_code: ShopPromoCode };
export type BulkStopShopPromoCodesRequest = components['schemas']['BulkStopShopPromoCodesDto'];
export type BulkStopShopPromoCodesResponse = Omit<
  components['schemas']['ShopPromoCodeStopListResponseDto'],
  'results'
> & { results: ShopPromoCode[] };
