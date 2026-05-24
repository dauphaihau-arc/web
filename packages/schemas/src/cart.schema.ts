import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'
import { CART_CONFIG } from '@arc/enums/cart'
import { PRODUCT_CONFIG } from '@arc/enums/product'

export const productCartSchema = z.object({
  id: idSchema,
  inventory: idSchema,
  product: idSchema,
  variant: idSchema.optional(),
  quantity: z.number().max(PRODUCT_CONFIG.MAX_STOCK),
  is_select_order: z
    .boolean()
    .default(true),
  created_at: z.date(),
  updated_at: z.date(),
})

export const shopCartSchema = z.object({
  id: idSchema,
  shop: idSchema,
  products: z.array(productCartSchema),
  created_at: z.date(),
  updated_at: z.date(),
})

export const cartSchema = z.object({
  id: idSchema,
  user: idSchema,
  items: z
    .array(shopCartSchema)
    .max(CART_CONFIG.MAX_ITEMS),
  created_at: z.date(),
  updated_at: z.date(),
})
