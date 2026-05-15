import { z } from 'zod';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';
import { CART_CONFIG } from '~/config/enums/cart';
import { PRODUCT_CONFIG } from '~/config/enums/product';

export const productCartSchema = z.object({
  id: objectIdSchema,
  inventory: objectIdSchema,
  product: objectIdSchema,
  variant: objectIdSchema.optional(),
  quantity: z.number().max(PRODUCT_CONFIG.MAX_STOCK),
  is_select_order: z
    .boolean()
    .default(true),
  created_at: z.date(),
  updated_at: z.date(),
});

export const shopCartSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  products: z.array(productCartSchema),
  created_at: z.date(),
  updated_at: z.date(),
});

export const cartSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  items: z
    .array(shopCartSchema)
    .max(CART_CONFIG.MAX_ITEMS),
  created_at: z.date(),
  updated_at: z.date(),
});
