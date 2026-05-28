import { z } from 'zod'
import { PRODUCT_CONFIG } from '@arc/enums/product'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const productInventorySchema = z.object({
  id: idSchema,
  shop: idSchema,
  product: idSchema,
  amount: z
    .number()
    .min(PRODUCT_CONFIG.MIN_PRICE, `Price must at least ${PRODUCT_CONFIG.MIN_PRICE}$`)
    .max(PRODUCT_CONFIG.MAX_PRICE,
      `Price must be less than or equal to ${PRODUCT_CONFIG.MAX_PRICE}$`),
  stock: z
    .number()
    .min(PRODUCT_CONFIG.MIN_STOCK)
    .max(PRODUCT_CONFIG.MAX_STOCK),
  sku: z
    .string()
    .max(PRODUCT_CONFIG.MAX_CHAR_SKU)
    .optional(),
  variant: z.string().optional(),
  reservations: z.array(z.any()),
  updated_at: z.date(),
  created_at: z.date(),
})
