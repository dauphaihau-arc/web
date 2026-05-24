import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'
import { productInventorySchema } from '@arc/schemas/product-inventory.schema'
import { productVariantOptSchema, productVariantSchema } from '@arc/schemas/product-variant.schema'
import {
  baseProductSchema,
  productStateUserCanModify,
} from '@arc/schemas/product.schema'

const createProductInventorySchema = productInventorySchema.pick({
  price: true,
  sku: true,
  stock: true,
})

const updateVariantOptionsSchema = createProductInventorySchema.merge(
  productVariantSchema.pick({ variant_name: true }).merge(
    productVariantOptSchema.pick({ variant: true }),
  ),
)

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
      update_variants: z.array(productVariantSchema.pick({ id: true, variant_name: true }).partial()).optional(),
      variant_inventories: z
        .array(
          productInventorySchema
            .pick({
              id: true, price: true, sku: true, stock: true,
            })
            .strict(),
        )
        .optional(),
      new_single_variants: z.array(
        createProductInventorySchema.merge(
          productVariantSchema.pick({ variant_name: true }),
        ),
      ),
      new_combine_variants: z.array(
        productVariantSchema
          .pick({ variant_name: true })
          .merge(
            z.object({
              variant_options: z.array(updateVariantOptionsSchema),
            }),
          ),
      ),
    }),
  )
  .partial()
