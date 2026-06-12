import { z } from 'zod';
import { ProductStates, ProductVariantTypes } from '@arc/enums/product';

const requestGetListParamsSchema = z.object({
  page: z.union([z.number(), z.any()]).optional(),
  limit: z.number().optional(),
  populate: z.string().optional(),
  select: z.string().optional(),
  sortBy: z.string().optional(),
});

export const listShopProductsRequestSchema = requestGetListParamsSchema.extend({
  search: z.string().optional(),
  state: z.nativeEnum(ProductStates).optional(),
  category_id: z.string().uuid().optional(),
});

export const listShopProductsItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  state: z.nativeEnum(ProductStates).optional(),
  variant_type: z.nativeEnum(ProductVariantTypes).optional(),
  images: z.array(z.object({
    id: z.string(),
    storage_key: z.string(),
    rank: z.number(),
  })),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    option_value_1: z.string().optional(),
    option_value_2: z.string().optional(),
    image_storage_key: z.string().optional(),
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
});

export const productStateCountsSchema = z.object({
  all: z.number(),
  active: z.number(),
  inactive: z.number(),
  draft: z.number(),
});

export const listShopProductsResponseSchema = z.object({
  items: z.array(listShopProductsItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  state_counts: productStateCountsSchema,
});

export const shopProductDetailApiResponseSchema = z.object({
  id: z.string(),
  public_id: z.string().optional(),
  shop_id: z.string(),
  shop_public_id: z.string().optional(),
  state: z.nativeEnum(ProductStates),
  category_id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  who_made: z.string(),
  is_digital: z.boolean(),
  non_taxable: z.boolean(),
  variant_type: z.nativeEnum(ProductVariantTypes).optional(),
  variant_group_name: z.string().optional(),
  variant_sub_group_name: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    storage_key: z.string(),
    rank: z.number(),
    variant_status: z.string(),
    variant_error: z.string().optional(),
    variants_generated_at: z.coerce.date().optional(),
    variants: z.array(z.object({
      id: z.string(),
      variant: z.string(),
      storage_key: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      format: z.string().optional(),
    })).optional(),
  })),
  attributes: z.array(z.object({
    id: z.string(),
    category_attribute_id: z.string(),
    category_attribute_name: z.string(),
    input_type: z.string(),
    selected_option_id: z.string().optional(),
    selected_option_value: z.string().optional(),
    selected_text: z.string().optional(),
  })),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    option_value_1: z.string().optional(),
    option_value_2: z.string().optional(),
    image_storage_key: z.string().optional(),
    rank: z.number(),
  })),
  inventory: z.array(z.object({
    id: z.string(),
    product_variant_id: z.string().optional(),
    sku: z.string().optional(),
    stock: z.number(),
    amount_minor: z.number().int().nonnegative().optional(),
    original_amount_minor: z.number().int().nonnegative().optional(),
    currency: z.string().optional(),
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
      charge_type: z.string(),
      rank: z.number(),
    })),
  }).optional(),
});

export const detailShopProductInventorySchema = z.object({
  id: z.string().optional(),
  amount: z.number().optional(),
  stock: z.number().optional(),
  sku: z.string().optional(),
  original_price: z.number().optional(),
  currency: z.string().optional(),
});

export const detailShopProductVariantOptionSchema = z.object({
  id: z.string(),
  variant: z.object({
    id: z.string(),
    variant_name: z.string(),
  }),
  inventory: detailShopProductInventorySchema,
});

export const detailShopProductVariantSchema = z.object({
  id: z.string(),
  variant_name: z.string(),
  inventory: detailShopProductInventorySchema.optional(),
  variant_options: z.array(detailShopProductVariantOptionSchema).optional(),
});

export const detailShopProductResponseSchema = z.object({
  product: z.object({
    id: z.string(),
    state: z.nativeEnum(ProductStates),
    title: z.string(),
    description: z.string(),
    who_made: z.string(),
    is_digital: z.boolean(),
    variant_type: z.string(),
    variant_group_name: z.string().optional(),
    variant_sub_group_name: z.string().optional(),
    tags: z.array(z.string()),
    category: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable(),
    images: z.array(z.object({
      id: z.string(),
      relative_url: z.string(),
      rank: z.number(),
      url: z.string().optional(),
    })),
    attributes: z.array(z.object({
      id: z.string(),
      attribute: z.string(),
      selected: z.string(),
    })),
    inventory: detailShopProductInventorySchema,
    variants: z.array(detailShopProductVariantSchema),
  }),
});

export const issueProductImageUploadUrlRequestSchema = z.object({
  productId: z.string(),
  content_type: z.string(),
  asset_type: z.literal('original').optional(),
});

export const issueProductImageUploadUrlResponseSchema = z.object({
  key: z.string(),
  presigned_url: z.string(),
  method: z.literal('PUT').optional(),
});

export const removeProductRequestSchema = z.object({
  id: z.string(),
});

export const bulkMutateShopProductsActionSchema = z.enum([
  'publish',
  'deactivate',
  'remove',
]);

export const bulkMutateShopProductsRequestSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: bulkMutateShopProductsActionSchema,
});

export const bulkMutateShopProductsResponseSchema = z.object({
  succeeded_ids: z.array(z.string()),
  failed: z.array(z.object({
    id: z.string(),
    code: z.string(),
    reason: z.string(),
  })),
});
