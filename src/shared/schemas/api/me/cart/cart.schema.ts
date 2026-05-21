import { z } from 'zod';

export const cartProductItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  is_selected: z.boolean(),
  unit_price: z.number(),
  product: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    shop: z.object({
      slug: z.string(),
    }),
    variant_type: z.string().optional(),
    variant_group_name: z.string().optional(),
    variant_sub_group_name: z.string().optional(),
    image_url: z.string().optional(),
  }),
  inventory: z.object({
    id: z.string(),
    price: z.number(),
    sale_price: z.number().optional(),
    stock: z.number(),
    sku: z.string().optional(),
    variant_name: z.string().optional(),
  }),
});

export const cartShopGroupSchema = z.object({
  shop: z.object({
    id: z.string(),
    name: z.string(),
  }),
  items: z.array(cartProductItemSchema),
  total_price: z.number(),
  total_shipping_fee: z.number(),
});

export const cartSummarySchema = z.object({
  subtotal_price: z.number(),
  total_discount: z.number(),
  subtotal_after_discount: z.number(),
  total_shipping_fee: z.number(),
  total_price: z.number(),
  total_selected_quantity: z.number(),
  total_quantity: z.number(),
});

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
    variant_name: z.string().optional(),
  }),
  quantity: z.number(),
});

export const cartResourceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  is_temp: z.boolean(),
  shop_groups: z.array(cartShopGroupSchema),
  recent_items: z.array(cartRecentItemSchema),
  total_quantity: z.number(),
});

export const cartResponseSchema = z.object({
  cart: cartResourceSchema.nullable(),
  summary: cartSummarySchema,
});

export const getCartRequestSchema = z.object({
  cart_id: z.string().optional(),
});

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
});

export const addProductToCartRequestSchema = z.object({
  inventory_id: z.string(),
  quantity: z.number(),
  variant_id: z.string().optional(),
  is_temp: z.boolean().optional(),
});

export const deleteCartProductRequestSchema = z.object({
  inventory_id: z.string(),
});
