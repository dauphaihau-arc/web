import { z } from 'zod';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';
import { PRODUCT_CONFIG, PRODUCT_REGEX_NOT_URL } from '~/config/enums/product';

export const productVariantOptSchema = z.object({
  id: objectIdSchema,
  variant: objectIdSchema,
  inventory: objectIdSchema,
});

export const productVariantSchema = z.object({
  id: objectIdSchema,
  product: objectIdSchema,
  inventory: objectIdSchema.optional(),
  variant_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME),
  image_relative_url: z
    .string()
    .startsWith('shop', 'must start with shop')
    .regex(PRODUCT_REGEX_NOT_URL, 'must not absolute url')
    .optional(),
  variant_options: z.array(productVariantOptSchema).optional(),
});
