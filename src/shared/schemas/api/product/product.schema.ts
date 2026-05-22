import { z } from 'zod';

const requestGetListParamsSchema = z.object({
  page: z.union([z.number(), z.any()]).optional(),
  limit: z.number().optional(),
  populate: z.string().optional(),
  select: z.string().optional(),
  sortBy: z.string().optional(),
});

export const publicProductShopSchema = z.object({
  id: z.string(),
  public_id: z.string().optional(),
  shop_name: z.string(),
  slug: z.string(),
});

export const publicProductImageSchema = z.object({
  storage_key: z.string(),
  url: z.string().optional(),
  variant: z.string().optional(),
  variants: z.record(z.string(), z.object({
    storage_key: z.string(),
    url: z.string().optional(),
  })).optional(),
});

export const publicProductInventorySummarySchema = z.object({
  price: z.number(),
  sale_price: z.number().optional(),
  stock: z.number(),
  sku: z.string().optional(),
});

export const getProductsRequestSchema = requestGetListParamsSchema.extend({
  category_id: z.string().optional(),
  shop_id: z.string().optional(),
  search: z.string().optional(),
  title: z.string().optional(),
  is_digital: z.boolean().optional(),
  who_made: z.string().optional(),
  order: z.string().optional(),
});

export const getProductsResponseItemSchema = z.object({
  id: z.string(),
  shop: publicProductShopSchema,
  category_id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  image: publicProductImageSchema.optional(),
  variant_type: z.string().optional(),
  inventory: publicProductInventorySummarySchema.optional(),
  created_at: z.union([z.string(), z.date()]),
});

export const getProductsResponseSchema = z.object({
  items: z.array(getProductsResponseItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
});

export const publicProductDetailImageSchema = z.object({
  id: z.string(),
  storage_key: z.string(),
  url: z.string().optional(),
  rank: z.number(),
  variants: z.record(z.string(), z.object({
    storage_key: z.string(),
    url: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().optional(),
  })).optional(),
});

export const publicProductDetailVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  option_value_1: z.string().optional(),
  option_value_2: z.string().optional(),
  image_storage_key: z.string().optional(),
  rank: z.number(),
});

export const publicProductDetailInventorySchema = z.object({
  id: z.string(),
  product_variant_id: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number(),
  price: z.number(),
  sale_price: z.number().optional(),
});

export const publicProductShippingDestinationSchema = z.object({
  id: z.string(),
  country_code: z.string(),
  delivery_time_label: z.string(),
  service: z.string(),
  charge_type: z.string(),
  rank: z.number(),
});

export const publicProductShippingSchema = z.object({
  origin_country: z.string(),
  process_time_label: z.string(),
  destinations: z.array(publicProductShippingDestinationSchema),
});

export const getDetailProductBySlugResponseSchema = z.object({
  id: z.string(),
  shop: publicProductShopSchema,
  category_id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  who_made: z.string(),
  is_digital: z.boolean(),
  variant_type: z.string().optional(),
  variant_group_name: z.string().optional(),
  variant_sub_group_name: z.string().optional(),
  images: z.array(publicProductDetailImageSchema),
  variants: z.array(publicProductDetailVariantSchema),
  inventory: z.array(publicProductDetailInventorySchema),
  shipping: publicProductShippingSchema.optional(),
});
