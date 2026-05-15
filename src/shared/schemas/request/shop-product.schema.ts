import { z } from 'zod';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';
import { productShippingSchema } from '~/schemas/product-shipping.schema';
import { productInventorySchema } from '~/schemas/product-inventory.schema';
import { productVariantOptSchema, productVariantSchema } from '~/schemas/product-variant.schema';
import {
  baseProductSchema,
  productStateUserCanModify
} from '~/schemas/product.schema';

// region create product
export const createProductInventorySchema = productInventorySchema.pick({
  price: true,
  sku: true,
  stock: true,
});

export const createProductShippingSchema = productShippingSchema.pick({
  country: true,
  zip: true,
  process_time: true,
  standard_shipping: true,
});

export const createProductBodySchema = baseProductSchema
  .pick({
    title: true,
    description: true,
    variant_type: true,
    is_digital: true,
    who_made: true,
    state: true,
  })
  .merge(
    z.object({
      attributes: z.array(
        z.object({
          attribute_id: objectIdSchema,
          selected: z.string(),
        })
      ).default([]),
      category_id: objectIdSchema,
      state: productStateUserCanModify,
      tags: baseProductSchema.shape.tags.default([]),
    })
  );

// endregion

// region update product
export const updateVariantOptionsSchema = createProductInventorySchema.merge(
  productVariantSchema.pick({ variant_name: true }).merge(
    productVariantOptSchema.pick({ variant: true })
  )
);

export const updateProductSchema = baseProductSchema
  .pick({
    title: true,
    description: true,
    variant_type: true,
    is_digital: true,
    // state: true,
    who_made: true,
  })
  .merge(
    z.object({
      tags: baseProductSchema.shape.tags.default([]).optional(),
      state: productStateUserCanModify,
      category_id: objectIdSchema,
      attributes: z.array(
        z.object({
          attribute_id: objectIdSchema,
          selected: z.string(),
        })
      ).optional(),
      // images: z
      //   .array(productImageSchema.partial())
      //   .min(PRODUCT_CONFIG.MIN_IMAGES)
      //   .max(PRODUCT_CONFIG.MAX_IMAGES),
      update_variants: z.array(productVariantSchema.pick({ id: true, variant_name: true }).partial()).optional(),
      variant_inventories: z
        .array(
          productInventorySchema
            .pick({
              id: true, price: true, sku: true, stock: true,
            })
            .strict()
        )
        .optional(),
      new_single_variants: z.array(
        createProductInventorySchema.merge(
          productVariantSchema.pick({ variant_name: true })
        )),
      new_combine_variants: z.array(
        productVariantSchema
          .pick({ variant_name: true })
          .merge(
            z.object({
              variant_options: z.array(updateVariantOptionsSchema),
            })
          )),
    })
  )
  // .merge(
  //   createProductInventorySchema
  // )
  .partial();
// endregion
