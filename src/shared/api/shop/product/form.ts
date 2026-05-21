import type { z } from 'zod';
import type { ElementType, PickPartial, RequiredFields } from '~/shared/contracts/utils';
import type {
  Product,
  ProductCombineVariant,
  ProductImage,
  ProductInventory,
  ProductSingleVariant,
  ProductVariant
} from '~/shared/models/product';
import type {
  createProductBodySchema,
  createProductInventorySchema,
  createProductShippingSchema,
  updateProductSchema,
  updateVariantOptionsSchema
} from '~/shared/schemas/request/shop-product.schema';
import type { ProductVariantTypes } from '~/shared/config/enums/product';
import type { RequestGetListParams } from '~/shared/contracts/common';

export type CreateProductShipping = z.infer<typeof createProductShippingSchema>;
export type CreateProductInventory = z.infer<typeof createProductInventorySchema>;
export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
export type UpdateVariantOptions = z.infer<typeof updateVariantOptionsSchema>;
export type ReqAttributeOption = ElementType<CreateProductBody['attributes']>;

export type VariantOption = Pick<ProductInventory, 'price' | 'stock' | 'sku'> & {
  variant_name: ProductVariant['variant_name']
};

export type NoneVariant = {
  variant_type: ProductVariantTypes.NONE
} & CreateProductInventory;

export type SingleVariant = {
  variant_type: ProductVariantTypes.SINGLE
  variant_options: VariantOption[]
} & Pick<ProductSingleVariant, 'variant_group_name'>;

export type CombineVariant = {
  variant_type: ProductVariantTypes.COMBINE
  variant_options: {
    variant_name: ProductVariant['variant_name']
    variant_options: VariantOption[]
  }[]
} & Pick<ProductCombineVariant, 'variant_group_name' | 'variant_sub_group_name'>;

type TNoneVariant = Omit<NoneVariant, 'variant_type'>;
export type StateNoneVariant = PickPartial<TNoneVariant, 'price' | 'sku'>;
export type StateSingleVariant = Partial<Omit<SingleVariant, 'variant_type'>>;
export type StateCombineVariant = Partial<Omit<CombineVariant, 'variant_type'>>;

export type StateSubmit = RequiredFields<
  Partial<CreateProductBody>,
  'who_made' | 'is_digital' | 'variant_type' | 'attributes' | 'tags'
>;

export type RequestUpdateProductBody = UpdateProductBody & {
  images?: Partial<Pick<ProductImage, 'id' | 'relative_url' | 'rank'>>[]
};

export type ShopGetProductsQueryParams = Partial<Pick<Product, 'title'> & RequestGetListParams>;
