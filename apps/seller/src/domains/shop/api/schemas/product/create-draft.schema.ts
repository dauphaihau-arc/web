import { z } from 'zod';
import {
  ProductShippingCharge,
  ProductVariantTypes,
  ProductWhoMade
} from '@arc/enums/product';

export const createDraftProductRequestImageSchema = z.object({
  storage_key: z.string(),
  rank: z.number(),
});

export const createDraftProductRequestAttributeSchema = z.object({
  category_attribute_id: z.string(),
  selected_option_id: z.string().optional(),
  selected_text: z.string().optional(),
});

export const createDraftProductRequestVariantSchema = z.object({
  client_key: z.string(),
  option_value_1: z.string(),
  option_value_2: z.string().optional(),
});

export const createDraftProductRequestInventorySchema = z.object({
  variant_client_key: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number(),
});

export const createDraftProductRequestPricingSchema = z.object({
  variant_client_key: z.string().optional(),
  amount_minor: z.number().int().nonnegative(),
  original_amount_minor: z.number().int().nonnegative().optional(),
  currency: z.string(),
});

export const createDraftProductRequestShippingDestinationSchema = z.object({
  country_code: z.string(),
  delivery_time_label: z.string(),
  service: z.string(),
  charge_type: z.nativeEnum(ProductShippingCharge),
});

export const createDraftProductRequestShippingSchema = z.object({
  origin_country: z.string(),
  origin_zip: z.string(),
  process_time_label: z.string(),
  destinations: z.array(createDraftProductRequestShippingDestinationSchema),
});

export const createDraftProductRequestSchema = z.object({
  category_id: z.string(),
  title: z.string(),
  description: z.string(),
  who_made: z.nativeEnum(ProductWhoMade),
  is_digital: z.boolean(),
  non_taxable: z.boolean().optional(),
  variant_type: z.nativeEnum(ProductVariantTypes),
  variant_group_name: z.string().optional(),
  variant_sub_group_name: z.string().optional(),
  images: z.array(createDraftProductRequestImageSchema).optional(),
  attributes: z.array(createDraftProductRequestAttributeSchema).optional(),
  variants: z.array(createDraftProductRequestVariantSchema).optional(),
  inventory: z.array(createDraftProductRequestInventorySchema),
  pricing: z.array(createDraftProductRequestPricingSchema),
  shipping: createDraftProductRequestShippingSchema,
});

export const createDraftProductResponseSchema = z.object({
  id: z.string(),
  shop_id: z.string(),
  category_id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  who_made: z.nativeEnum(ProductWhoMade),
  is_digital: z.boolean(),
  variant_type: z.nativeEnum(ProductVariantTypes).optional(),
  variant_group_name: z.string().optional(),
  variant_sub_group_name: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    storage_key: z.string(),
    rank: z.number(),
    url: z.string().optional(),
  })),
  attributes: z.array(z.object({
    id: z.string(),
    category_attribute_id: z.string(),
    selected_option_id: z.string().optional(),
    selected_text: z.string().optional(),
  })),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    option_value_1: z.string().optional(),
    option_value_2: z.string().optional(),
    rank: z.number(),
  })),
  inventory: z.array(z.object({
    id: z.string(),
    product_variant_id: z.string().optional(),
    sku: z.string().optional(),
    stock: z.number(),
    amount_minor: z.number().int().nonnegative(),
    original_amount_minor: z.number().int().nonnegative().optional(),
    currency: z.string(),
  })),
  shipping: z.object({
    id: z.string(),
    origin_country: z.string(),
    origin_zip: z.string(),
    process_time_label: z.string(),
    destinations: z.array(z.object({
      id: z.string(),
      country_code: z.string(),
      delivery_time_label: z.string(),
      service: z.string(),
      charge_type: z.nativeEnum(ProductShippingCharge),
      rank: z.number(),
    })),
  }).optional(),
});
