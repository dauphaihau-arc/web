import { z } from 'zod';
import { idSchema } from '~/shared/schemas/primitives/id.schema';
import { productInventorySchema } from '~/shared/schemas/product-inventory.schema';
import { productShippingSchema } from '~/shared/schemas/product-shipping.schema';
import { productVariantOptSchema, productVariantSchema } from '~/shared/schemas/product-variant.schema';
import {
  baseProductSchema,
  productStateUserCanModify
} from '~/shared/schemas/product.schema';

export const createProductInventoryFormSchema = productInventorySchema.pick({
  price: true,
  sku: true,
  stock: true,
});

export const createProductShippingFormSchema = productShippingSchema.pick({
  country: true,
  zip: true,
  process_time: true,
  standard_shipping: true,
});

export const createProductFormSchema = baseProductSchema
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
          attribute_id: idSchema,
          selected: z.string(),
        })
      ).default([]),
      category_id: idSchema,
      state: productStateUserCanModify,
      tags: baseProductSchema.shape.tags.default([]),
    })
  );

export const updateVariantOptionsFormSchema = createProductInventoryFormSchema.merge(
  productVariantSchema.pick({ variant_name: true }).merge(
    productVariantOptSchema.pick({ variant: true })
  )
);
