import { z } from 'zod'
import {
  PromoCodeIneligibleReason,
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion'

const selectedProductOptionSchema = z.object({
  option_id: z.string().optional(),
  option_name: z.string(),
  value_id: z.string().optional(),
  value: z.string(),
})

export const cartProductItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  is_selected: z.boolean(),
  unit_price_minor: z.number(),
  product: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    shop: z.object({
      slug: z.string(),
    }),
    image_url: z.string().optional(),
  }),
  inventory: z.object({
    id: z.string(),
    amount_minor: z.number(),
    original_amount_minor: z.number().optional(),
    currency: z.string(),
    stock: z.number(),
    sku: z.string().optional(),
    selected_options: z.array(selectedProductOptionSchema).default([]),
  }),
})

export const cartShopGroupSchema = z.object({
  shop: z.object({
    id: z.string(),
    name: z.string(),
  }),
  items: z.array(cartProductItemSchema),
  currency: z.string(),
  total_minor: z.number(),
  discount_minor: z.number().default(0),
  sale_discount_minor: z.number().default(0),
  shipping_minor: z.number(),
})

export const cartSummarySchema = z.object({
  currency: z.string(),
  subtotal_minor: z.number(),
  discount_minor: z.number(),
  subtotal_after_discount_minor: z.number(),
  shipping_minor: z.number(),
  total_minor: z.number(),
  total_selected_quantity: z.number(),
  total_quantity: z.number(),
})

export const cartCheckoutPolicySchema = z.object({
  max_order_total_minor: z.number(),
})

export const cartRecentItemSchema = z.object({
  item_id: z.string(),
  product: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    shop: z.object({
      slug: z.string(),
    }),
    image_url: z.string().optional(),
  }),
  inventory: z.object({
    selected_options: z.array(selectedProductOptionSchema).default([]),
  }),
  quantity: z.number(),
})

export const cartResourceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  is_temp: z.boolean(),
  shop_groups: z.array(cartShopGroupSchema),
  recent_items: z.array(cartRecentItemSchema),
  total_quantity: z.number(),
})

export const cartResponseSchema = z.object({
  cart: cartResourceSchema.nullable(),
  summary: cartSummarySchema,
  requires_sign_in_for_checkout: z.boolean().optional(),
  checkout_policy: cartCheckoutPolicySchema.optional(),
})

export const getCartRequestSchema = z.object({
  cart_id: z.string().optional(),
})

export const updateCartRequestSchema = z.object({
  cart_id: z.string().optional(),
  inventory_id: z.string().optional(),
  is_select_order: z.boolean().optional(),
  quantity: z.number().optional(),
  addition_info_temp_cart: z.object({
    promo_codes: z.array(z.string()),
    note: z.string().optional(),
  }).optional(),
  addition_info_shop_carts: z.array(z.object({
    shop_id: z.string(),
    promo_codes: z.array(z.string()).optional(),
    note: z.string().optional(),
  })).optional(),
})

export const addProductToCartRequestSchema = z.object({
  inventory_id: z.string(),
  quantity: z.number(),
  variant_id: z.string().optional(),
  is_temp: z.boolean().optional(),
})

export const deleteCartProductRequestSchema = z.object({
  inventory_id: z.string(),
})

/**
 * Minimal Promo Code offer returned by the public discovery endpoint. Money
 * fields are major units already resolved in the buyer's checkout currency, so
 * consumers must format them with the shared currency helpers instead of
 * scaling minor units.
 *
 * The endpoint lists both offers the buyer can redeem now and offers the buyer
 * cannot redeem yet. `is_eligible` marks the latter and `ineligible_reason`
 * explains why, so callers render a disabled card instead of filtering.
 */
export const promoCodeOfferItemSchema = z.object({
  code: z.string(),
  benefit_type: z.nativeEnum(PromotionBenefitType),
  product_scope: z.nativeEnum(PromotionProductScope),
  amount_off: z.number().nullable().optional(),
  percent_off: z.number().nullable().optional(),
  min_order_type: z.nativeEnum(PromotionMinOrderType),
  min_order_value: z.number().nullable().optional(),
  min_purchase_quantity: z.number().nullable().optional(),
  end_date: z.string(),
  currency: z.string(),
  is_eligible: z.boolean(),
  ineligible_reason: z.nativeEnum(PromoCodeIneligibleReason).nullable(),
})

export const getCartPromoCodesRequestSchema = z.object({
  cart_id: z.string().optional(),
  shop_id: z.string(),
})

export const getCartPromoCodesResponseSchema = z.object({
  promo_codes: z.array(promoCodeOfferItemSchema),
})

export const applyCartPromoCodeRequestSchema = z.object({
  cart_id: z.string().optional(),
  shop_id: z.string(),
  code: z.string(),
  promo_codes: z.array(z.string()),
})

export const applyCartPromoCodeResponseSchema = z.object({
  promo_codes: z.array(z.string()),
  applied_promo_codes: z.array(z.object({
    code: z.string(),
    benefit_type: z.nativeEnum(PromotionBenefitType),
  })),
})
