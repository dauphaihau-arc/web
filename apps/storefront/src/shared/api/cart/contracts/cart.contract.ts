import type { z } from 'zod';
import type {
  addProductToCartRequestSchema,
  cartProductItemSchema,
  cartRecentItemSchema,
  cartResourceSchema,
  cartResponseSchema,
  cartShopGroupSchema,
  cartSummarySchema,
  deleteCartProductRequestSchema,
  getCartRequestSchema,
  updateCartRequestSchema
} from '@arc/schemas/api/me/cart/cart.schema';

export type CartProductItem = z.infer<typeof cartProductItemSchema>;
export type CartShopGroup = z.infer<typeof cartShopGroupSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
export type CartRecentItem = z.infer<typeof cartRecentItemSchema>;
export type CartResource = z.infer<typeof cartResourceSchema>;
export type CartResponse = z.infer<typeof cartResponseSchema>;

export type GetCartRequest = z.infer<typeof getCartRequestSchema>;
export type GetCartResponse = CartResponse;

export type UpdateCartRequest = z.infer<typeof updateCartRequestSchema>;
export type UpdateCartResponse = CartResponse;

export type AddProductToCartRequest = z.infer<typeof addProductToCartRequestSchema>;
export type AddProductToCartResponse = CartResponse;

export type DeleteCartProductRequest = z.infer<typeof deleteCartProductRequestSchema>;
export type DeleteCartProductResponse = CartResponse;
