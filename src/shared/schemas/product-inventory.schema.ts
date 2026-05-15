import { z } from 'zod';
import { PRODUCT_CONFIG } from '~/config/enums/product';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';

export const productInventorySchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  product: objectIdSchema,
  price: z
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
});
