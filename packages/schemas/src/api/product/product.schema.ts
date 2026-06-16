import { z } from 'zod'

const requestGetListParamsSchema = z.object({
  page: z.union([z.number(), z.any()]).optional(),
  limit: z.number().optional(),
  populate: z.string().optional(),
  select: z.string().optional(),
  sortBy: z.string().optional(),
})

export const publicProductShopSchema = z.object({
  id: z.string(),
  public_id: z.string().optional(),
  shop_name: z.string(),
  slug: z.string(),
})

export const publicProductImageSchema = z.object({
  storage_key: z.string(),
  variant: z.string().optional(),
  variants: z.record(z.string(), z.object({
    storage_key: z.string(),
  })).optional(),
})

export const publicProductListPricingSchema = z.object({
  min_amount_minor: z.number().int().nonnegative().optional(),
  max_amount_minor: z.number().int().nonnegative().optional(),
  original_min_amount_minor: z.number().int().nonnegative().optional(),
  original_max_amount_minor: z.number().int().nonnegative().optional(),
  currency: z.string(),
})

export const publicProductListAvailabilitySchema = z.object({
  in_stock: z.boolean(),
  low_stock: z.boolean(),
  stock_total: z.number().int().nonnegative(),
})

export const getProductsRequestSchema = requestGetListParamsSchema.extend({
  category_id: z.string().optional(),
  shop_id: z.string().optional(),
  search: z.string().optional(),
  title: z.string().optional(),
  is_digital: z.boolean().optional(),
  who_made: z.string().optional(),
  min_price: z.union([z.string(), z.number()]).optional(),
  max_price: z.union([z.string(), z.number()]).optional(),
  order: z.string().optional(),
}).catchall(z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.undefined(),
]))

export const getProductsResponseItemSchema = z.object({
  id: z.string(),
  shop: publicProductShopSchema,
  category_id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  image: publicProductImageSchema.optional(),
  variant_type: z.string().optional(),
  pricing: publicProductListPricingSchema.optional(),
  availability: publicProductListAvailabilitySchema,
  variant_count: z.number().int().nonnegative(),
  has_free_shipping: z.boolean().optional(),
  created_at: z.union([z.string(), z.date()]),
})

export const productSuggestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  shop: publicProductShopSchema,
})

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
})

export const publicProductFacetOptionSchema = z.object({
  option_key: z.string(),
  value: z.string(),
})

export const publicProductFacetSchema = z.object({
  facet_key: z.string(),
  attribute_name: z.string(),
  options: z.array(publicProductFacetOptionSchema),
})

export const getProductFacetsResponseSchema = z.object({
  facets: z.array(publicProductFacetSchema),
})

export const getProductSuggestionsResponseSchema = z.object({
  items: z.array(productSuggestionSchema),
})

export const getProductRecommendationsResponseSchema = z.object({
  items: z.array(getProductsResponseItemSchema),
})

export const productRecommendationSectionSchema = z.object({
  type: z.enum([
    'similar_products',
    'from_same_seller',
    'customers_also_viewed',
    'frequently_bought_together',
  ]),
  title: z.string(),
  items: z.array(getProductsResponseItemSchema),
})

export const getProductRecommendationSectionsResponseSchema = z.object({
  sections: z.array(productRecommendationSectionSchema),
})

export const recordProductViewResponseSchema = z.object({
  ok: z.literal(true),
})

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
})

export const publicProductDetailVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  option_value_1: z.string().optional(),
  option_value_2: z.string().optional(),
  image_storage_key: z.string().optional(),
  rank: z.number(),
})

export const publicProductDetailInventorySchema = z.object({
  id: z.string(),
  product_variant_id: z.string().optional(),
  option_value_1: z.string().optional(),
  option_value_2: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number(),
  amount_minor: z.number().int().nonnegative(),
  original_amount_minor: z.number().int().nonnegative().optional(),
  currency: z.string(),
})

export const publicProductShippingDestinationSchema = z.object({
  id: z.string(),
  country_code: z.string(),
  delivery_time_label: z.string(),
  service: z.string(),
  charge_type: z.string(),
  rank: z.number(),
})

export const publicProductShippingSchema = z.object({
  origin_country: z.string(),
  process_time_label: z.string(),
  destinations: z.array(publicProductShippingDestinationSchema),
})

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
  stock_notice_threshold: z.number().int().nonnegative(),
  images: z.array(publicProductDetailImageSchema),
  variants: z.array(publicProductDetailVariantSchema),
  inventory: z.array(publicProductDetailInventorySchema),
  shipping: publicProductShippingSchema.optional(),
})
