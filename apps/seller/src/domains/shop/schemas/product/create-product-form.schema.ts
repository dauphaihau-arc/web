import { z } from 'zod';
import { idSchema } from '@arc/schemas/primitives/id.schema';
import { productInventorySchema } from '@arc/schemas/product-inventory.schema';
import { productShippingSchema } from '@arc/schemas/product-shipping.schema';
import { productVariantOptSchema, productVariantSchema } from '@arc/schemas/product-variant.schema';
import { ProductStates, ProductVariantTypes } from '@arc/enums/product';
import {
  baseProductSchema,
  productStateUserCanModify,
} from '@arc/schemas/product.schema';

export const createProductInventoryFormSchema = productInventorySchema.pick({
  amount: true,
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
        }),
      ).default([]),
      category_id: idSchema.optional(),
      state: productStateUserCanModify,
      variant_type: z.nativeEnum(ProductVariantTypes),
      tags: baseProductSchema.shape.tags.default([]),
    }),
  )
  .refine(values => values.state === ProductStates.DRAFT || Boolean(values.category_id), {
    path: ['category_id'],
    message: 'Select a category before publishing',
  });

export const updateVariantOptionsFormSchema = createProductInventoryFormSchema.merge(
  productVariantSchema.pick({ variant_name: true }).merge(
    productVariantOptSchema.pick({ variant: true }),
  ),
);
