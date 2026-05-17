import type { z } from 'zod';
import type {
  Product,
  ProductCombineVariant,
  ProductImage,
  ProductInventory,
  ProductSingleVariant,
  ProductVariant
} from '~/shared/types/product';
import type {
  createProductShippingSchema, createProductBodySchema,
  updateProductSchema,
  updateVariantOptionsSchema
  , createProductInventorySchema
} from '~/shared/schemas/request/shop-product.schema';
import type { RequestGetListParams } from '~/shared/types/common';
import type {
  ProductShippingCharge,
  ProductVariantTypes,
  ProductWhoMade
} from '~/shared/config/enums/product';
import type { ElementType, PickPartial, RequiredFields } from '~/shared/types/utils';

// region create product
export type CreateProductShipping = z.infer<typeof createProductShippingSchema>;

export type CreateProductInventory = z.infer<typeof createProductInventorySchema>;

export type CreateProductBody = z.infer<typeof createProductBodySchema>;

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

export type RequestCreateProductBody = CreateProductBody & {
  images: Pick<ProductImage, 'relative_url' | 'rank'>[]
  shipping: CreateProductShipping
} & (NoneVariant | SingleVariant | CombineVariant);

export type CreateProductDraftImage = {
  storage_key: string
  rank: number
};

export type CreateProductDraftAttribute = {
  category_attribute_id: string
  selected_option_id?: string
  selected_text?: string
};

export type CreateProductDraftVariant = {
  client_key: string
  option_value_1: string
  option_value_2?: string
};

export type CreateProductDraftInventory = Pick<ProductInventory, 'price' | 'sku' | 'stock'> & {
  variant_client_key?: string
  sale_price?: number
};

export type CreateProductDraftShipping = {
  origin_country: string
  origin_zip: string
  process_time_label: string
  destinations: {
    country_code: string
    delivery_time_label: string
    service: string
    charge_type: ProductShippingCharge
  }[]
};

export type RequestCreateProductDraftBody = {
  category_id: string
  title: string
  description: string
  who_made: ProductWhoMade
  is_digital: boolean
  non_taxable?: boolean
  variant_type: ProductVariantTypes
  variant_group_name?: string
  variant_sub_group_name?: string
  images?: CreateProductDraftImage[]
  attributes?: CreateProductDraftAttribute[]
  variants?: CreateProductDraftVariant[]
  inventory: CreateProductDraftInventory[]
  shipping: CreateProductDraftShipping
};

export type ResponseShopProductDraft = {
  id: string
  shop_id: string
  category_id?: string
  title: string
  description: string
  who_made: ProductWhoMade
  is_digital: boolean
  variant_type?: ProductVariantTypes
  variant_group_name?: string
  variant_sub_group_name?: string
  images: {
    id: string
    storage_key: string
    rank: number
    url?: string
  }[]
  attributes: {
    id: string
    category_attribute_id: string
    selected_option_id?: string
    selected_text?: string
  }[]
  variants: {
    id: string
    name: string
    option_value_1?: string
    option_value_2?: string
    rank: number
  }[]
  inventory: {
    id: string
    product_variant_id?: string
    sku?: string
    stock: number
    price: number
    sale_price?: number
  }[]
  shipping?: {
    id: string
    origin_country: string
    origin_zip: string
    process_time_label: string
    destinations: {
      id: string
      country_code: string
      delivery_time_label: string
      service: string
      charge_type: ProductShippingCharge
      rank: number
    }[]
  }
};

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

// export type ResponseShopGetDetailProduct = {
//   product: ProductPopulated
// };
