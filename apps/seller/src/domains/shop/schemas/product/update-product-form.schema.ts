import { z } from 'zod';
import { idSchema } from '@arc/schemas/primitives/id.schema';
import {
  baseProductSchema,
  combineVariantSchema,
  productStateUserCanModify,
  singleVariantSchema,
} from '@arc/schemas/product.schema';


export const updateProductFormSchema = baseProductSchema
  .pick({
    title: true,
    description: true,
    variant_type: true,
    is_digital: true,
    who_made: true,
  })
  .merge(
    z.object({
      tags: baseProductSchema.shape.tags.default([]).optional(),
      state: productStateUserCanModify,
      category_id: idSchema,
      attributes: z.array(
        z.object({
          attribute_id: idSchema,
          selected: z.string(),
        }),
      ).optional(),
      variant_group_name: singleVariantSchema.shape.variant_group_name.optional(),
      variant_sub_group_name: combineVariantSchema.shape.variant_sub_group_name.optional(),
    }),
  )
  .partial();
