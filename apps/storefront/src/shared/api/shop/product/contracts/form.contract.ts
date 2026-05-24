import type { z } from 'zod';
import type { ElementType, PickPartial, RequiredFields } from '~/shared/contracts/utils';
import type {
  createProductFormSchema,
  createProductInventoryFormSchema,
  createProductShippingFormSchema,
  updateVariantOptionsFormSchema
} from '~/shared/schemas/forms/shop/product/create-product-form.schema';
import type { updateProductFormSchema } from '~/shared/schemas/forms/shop/product/update-product-form.schema';
import type { ProductVariantTypes } from '~/shared/config/enums/product';
import type { RequestGetListParams } from '~/shared/contracts/common';

export type CreateProductShipping = z.infer<typeof createProductShippingFormSchema>;
export type CreateProductInventory = z.infer<typeof createProductInventoryFormSchema>;
export type CreateProductBody = z.infer<typeof createProductFormSchema>;
export type UpdateProductBody = z.infer<typeof updateProductFormSchema>;
export type UpdateVariantOptions = z.infer<typeof updateVariantOptionsFormSchema>;
export type ReqAttributeOption = ElementType<CreateProductBody['attributes']>;

export type VariantOption = {
  price?: number
  stock?: number
  sku?: string
  variant_name?: string
};

export type NoneVariant = {
  variant_type: ProductVariantTypes.NONE
} & CreateProductInventory;

export type SingleVariant = {
  variant_type: ProductVariantTypes.SINGLE
  variant_options: VariantOption[]
  variant_group_name?: string
};

export type CombineVariant = {
  variant_type: ProductVariantTypes.COMBINE
  variant_options: {
    variant_name?: string
    variant_options: VariantOption[]
  }[]
  variant_group_name?: string
  variant_sub_group_name?: string
};

type TNoneVariant = Omit<NoneVariant, 'variant_type'>;
export type StateNoneVariant = PickPartial<TNoneVariant, 'price' | 'sku'>;
export type StateSingleVariant = Partial<Omit<SingleVariant, 'variant_type'>>;
export type StateCombineVariant = Partial<Omit<CombineVariant, 'variant_type'>>;

export type StateSubmit = RequiredFields<
  Partial<CreateProductBody>,
  'who_made' | 'is_digital' | 'variant_type' | 'attributes' | 'tags'
>;

export type ProductImageReference = {
  id?: string
  relative_url?: string
  rank?: number
};

export type RequestUpdateProductBody = UpdateProductBody & {
  images?: ProductImageReference[]
};

export type ShopGetProductsQueryParams = Partial<RequestGetListParams> & {
  title?: string
};
