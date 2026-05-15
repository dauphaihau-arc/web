import type { z } from 'zod';
import type {
  combineVariantSchema,
  productAttributeSchema,
  productImageSchema,
  productSchema,
  singleVariantSchema
} from '~/schemas/product.schema';
import type { productInventorySchema } from '~/schemas/product-inventory.schema';
import type {
  productStandardShippingSchema,
  productShippingSchema
} from '~/schemas/product-shipping.schema';
import type { productVariantSchema } from '~/schemas/product-variant.schema';

export type Product = z.infer<typeof productSchema>;
export type ProductSingleVariant = z.infer<typeof singleVariantSchema>;
export type ProductCombineVariant = z.infer<typeof combineVariantSchema>;
export type ProductInventory = z.infer<typeof productInventorySchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductAttribute = z.infer<typeof productAttributeSchema>;
export type ProductStandardShipping = z.infer<typeof productStandardShippingSchema>;
export type ProductShipping = z.infer<typeof productShippingSchema>;

// export type ProductOptVariant = z.infer<typeof productVariantOptSchema>;
// export type PRODUCT_STATES_USER_CAN_MODIFY = z.infer<typeof productStateUserCanModify>;
