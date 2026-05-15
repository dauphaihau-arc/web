import type { z } from 'zod';
import type {
  Product,
  ProductCombineVariant,
  ProductImage,
  ProductInventory,
  ProductSingleVariant,
  ProductVariant
} from '~/types/product';
import type {
  createProductShippingSchema, createProductBodySchema,
  updateProductSchema,
  updateVariantOptionsSchema
  , createProductInventorySchema
} from '~/schemas/request/shop-product.schema';
import type { RequestGetListParams } from '~/types/common';
import type { PRODUCT_VARIANT_TYPES } from '~/config/enums/product';
import type { ElementType, PickPartial, RequiredFields } from '~/types/utils';

// region create product
export type CreateProductShipping = z.infer<typeof createProductShippingSchema>;

export type CreateProductInventory = z.infer<typeof createProductInventorySchema>;

export type CreateProductBody = z.infer<typeof createProductBodySchema>;

export type ReqAttributeOption = ElementType<CreateProductBody['attributes']>;

export type VariantOption = Pick<ProductInventory, 'price' | 'stock' | 'sku'> & {
  variant_name: ProductVariant['variant_name']
};

export type NoneVariant = {
  variant_type: PRODUCT_VARIANT_TYPES.NONE
} & CreateProductInventory;

export type SingleVariant = {
  variant_type: PRODUCT_VARIANT_TYPES.SINGLE
  variant_options: VariantOption[]
} & Pick<ProductSingleVariant, 'variant_group_name'>;

export type CombineVariant = {
  variant_type: PRODUCT_VARIANT_TYPES.COMBINE
  variant_options: {
    variant_name: ProductVariant['variant_name']
    variant_options: VariantOption[]
  }[]
} & Pick<ProductCombineVariant, 'variant_group_name' | 'variant_sub_group_name'>;

export type RequestCreateProductBody = CreateProductBody & {
  images: Pick<ProductImage, 'relative_url' | 'rank'>[]
  shipping: CreateProductShipping
} & (NoneVariant | SingleVariant | CombineVariant);

type TNoneVariant = Omit<NoneVariant, 'variant_type'>;
export type StateNoneVariant = PickPartial<TNoneVariant, 'price' | 'sku'>;

export type StateSingleVariant = Partial<Omit<SingleVariant, 'variant_type'>>;

export type StateCombineVariant = Partial<Omit<CombineVariant, 'variant_type'>>;

export type StateSubmit = RequiredFields<
  Partial<CreateProductBody>,
  'who_made' | 'is_digital' | 'variant_type' | 'attributes' | 'tags'
>;
// endregion

// region get products
export type ShopGetProductsQueryParams = Partial<Pick<Product, 'title' > & RequestGetListParams>;

export type ResponseShopGetProducts = Pick<Product, 'id' | 'title' | 'variant_type'> & {
  image_relative_url: ProductImage['relative_url']
  inventories: Pick<ProductInventory, 'variant' | 'price' | 'stock' | 'sku'>[]
};
// endregion

// region update product

// type StateSubmit
export type UpdateProductBody = z.infer<typeof updateProductSchema>;

export type UpdateVariantOptions = z.infer<typeof updateVariantOptionsSchema>;

export type RequestUpdateProductBody = UpdateProductBody & {
  images?: Partial<Pick<ProductImage, 'id' | 'relative_url' | 'rank'>>[]
  // shipping: CreateProductShipping
};
// endregion
