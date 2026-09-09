import { z } from 'zod';
import { idSchema } from '@arc/schemas/primitives/id.schema';
import { ProductVariantTypes, PRODUCT_CONFIG } from '@arc/enums/product';
import {
  baseProductSchema,
  productStateUserCanModify,
} from '@arc/schemas/product.schema';


export const updateProductFormSchema = baseProductSchema
  .pick({
    title: true,
    description: true,
    is_digital: true,
    who_made: true,
  })
  .merge(
    z.object({
      tags: baseProductSchema.shape.tags.default([]).optional(),
      state: productStateUserCanModify,
      variant_type: z.nativeEnum(ProductVariantTypes),
      category_id: idSchema,
      attributes: z.array(
        z.object({
          attribute_id: idSchema,
          selected: z.string(),
        }),
      ).optional(),
      variant_group_name: z.string().min(1).max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME).optional(),
      variant_sub_group_name: z.string().min(1).max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME).optional(),
    }),
  )
  .partial();
