import type { components, operations } from '@arc/schemas/api/generated/openapi';
import type {
  PromoCodeIneligibleReason,
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion';

type CartPromoCode = components['schemas']['CartPromoCodeResponseDto'];
type AppliedCartPromoCode = components['schemas']['CartAppliedPromoCodeResponseDto'];
type ApiApplyCartPromoCodeResponse = components['schemas']['CartPromoCodeApplyResponseDto'];

type GeneratedCartProductItem = components['schemas']['CartProductItemResponseDto'];
type GeneratedCartShopGroup = components['schemas']['CartShopGroupResponseDto'];
type GeneratedCartResource = components['schemas']['CartStateResponseDto'];
type GeneratedCartSummary = components['schemas']['CartSummaryResponseDto'];
type GeneratedCartResponse = components['schemas']['CartResponseDto'];

/**
 * Cart shipping state is delivered by the ticket-06 API before the published
 * OpenAPI package picks it up. Keep the local contract additive so older
 * generated schemas still type-check.
 */
export type CartProductItem = GeneratedCartProductItem & {
  shipping?: {
    available: boolean
    is_digital: boolean
    reason?: string
  }
};
export type CartShopGroup = Omit<GeneratedCartShopGroup, 'items'> & {
  items: CartProductItem[]
};
export type CartSummary = GeneratedCartSummary & {
  unavailable_quantity?: number
};
export type CartRecentItem = components['schemas']['CartRecentItemResponseDto'];
export type CartResource = Omit<GeneratedCartResource, 'shop_groups'> & {
  shop_groups: CartShopGroup[]
};
export type CartResponse = Omit<GeneratedCartResponse, 'cart' | 'summary'> & {
  cart: CartResource | null
  summary: CartSummary
};

/**
 * The contract enumerates the promo code values as plain strings; the app
 * compares and indexes them by the `@arc/enums` members, so the enum type is
 * kept on the enum-valued fields. The contract also declares the four money
 * fields as required numbers, while the server omits them or sends null for the
 * benefit type that does not use them; the display keeps its null handling.
 */
export type CartPromoCodeItem =
  Omit<CartPromoCode,
  | 'benefit_type'
  | 'product_scope'
  | 'min_order_type'
  | 'ineligible_reason'
  | 'amount_off'
  | 'percent_off'
  | 'min_order_value'
  | 'min_purchase_quantity'> & {
    benefit_type: PromotionBenefitType
    product_scope: PromotionProductScope
    min_order_type: PromotionMinOrderType
    ineligible_reason: PromoCodeIneligibleReason | null
    amount_off?: number | null
    percent_off?: number | null
    min_order_value?: number | null
    min_purchase_quantity?: number | null
  };

export type GetCartPromoCodesRequest = NonNullable<
  operations['Cart_promoCodes']['parameters']['query']
>;
export type GetCartPromoCodesResponse =
  Omit<components['schemas']['CartPromoCodeListResponseDto'], 'promo_codes'> &
  { promo_codes: CartPromoCodeItem[] };
export type ApplyCartPromoCodeRequest = components['schemas']['ApplyCartPromoCodeDto'];
export type ApplyCartPromoCodeResponse =
  Omit<ApiApplyCartPromoCodeResponse, 'applied_promo_codes'> &
  {
    applied_promo_codes: Array<Omit<AppliedCartPromoCode, 'benefit_type'> & {
      benefit_type: PromotionBenefitType
    }>
  };

export type GetCartRequest = NonNullable<operations['Cart_cart']['parameters']['query']>;
export type GetCartResponse = CartResponse;

export type UpdateCartRequest = components['schemas']['UpdateCartItemDto'];
export type UpdateCartResponse = CartResponse;

export type AddProductToCartRequest = components['schemas']['AddCartItemDto'];
export type AddProductToCartResponse = CartResponse;

export type DeleteCartProductRequest = NonNullable<
  operations['Cart_deleteItem']['parameters']['query']
>;
export type DeleteCartProductResponse = CartResponse;
