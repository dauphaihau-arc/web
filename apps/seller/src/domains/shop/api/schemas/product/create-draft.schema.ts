import { z } from 'zod';
import { shippingRateSchema } from '@arc/schemas/shipping-profile.schema';
import { ProductWhoMade } from '@arc/enums/product';
import { idSchema } from '@arc/schemas/primitives/id.schema';

export const createDraftProductRequestImageSchema = z.object({
  storage_key: z.string(),
  rank: z.number(),
});

export const createDraftProductRequestAttributeSchema = z.object({
  category_attribute_id: z.string(),
  selected_option_id: z.string().optional(),
  selected_text: z.string().optional(),
});

export const createDraftProductRequestOptionValueSchema = z.object({
  client_ref: z.string(),
  value: z.string(),
  position: z.number().int().positive(),
});

export const createDraftProductRequestOptionSchema = z.object({
  client_ref: z.string(),
  name: z.string(),
  position: z.number().int().positive(),
  values: z.array(createDraftProductRequestOptionValueSchema),
});

export const createDraftProductRequestVariantSelectionSchema = z.object({
  option_ref: z.string(),
  value_ref: z.string(),
});

export const createDraftProductRequestVariantSchema = z.object({
  client_ref: z.string(),
  selections: z.array(createDraftProductRequestVariantSelectionSchema),
  lifecycle_state: z.enum(['active', 'inactive']),
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

export const createDraftProductResponseShippingSchema = z.object({
  profile_id: z.string(),
  profile_name: z.string(),
  profile_status: z.enum(['draft', 'active', 'archived']),
  profile_version: z.number().int().nonnegative(),
  currency: z.string().optional(),
  ship_from_country: z.string().optional(),
  ship_from_postal: z.string().optional(),
  checkout_ready: z.boolean(),
  readiness_issues: z.array(z.string()),
  rates: z.array(shippingRateSchema),
});

export const createDraftProductRequestSchema = z.object({
  idempotency_key: z.string().min(1),
  category_id: z.string(),
  title: z.string(),
  description: z.string(),
  who_made: z.nativeEnum(ProductWhoMade),
  is_digital: z.boolean(),
  non_taxable: z.boolean().optional(),
  options: z.array(createDraftProductRequestOptionSchema),
  images: z.array(createDraftProductRequestImageSchema).optional(),
  attributes: z.array(createDraftProductRequestAttributeSchema).optional(),
  variants: z.array(createDraftProductRequestVariantSchema).optional(),
  inventory: z.array(createDraftProductRequestInventorySchema),
  pricing: z.array(createDraftProductRequestPricingSchema),
  shipping_profile_id: idSchema.optional(),
});

export const createDraftProductResponseSchema = z.object({
  id: idSchema,
  shop_id: idSchema,
  category_id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  who_made: z.nativeEnum(ProductWhoMade),
  product_version: z.number().int().nonnegative().optional(),
  options: z.array(z.object({
    id: z.string(),
    name: z.string(),
    position: z.number(),
    values: z.array(z.object({
      id: z.string(),
      value: z.string(),
      position: z.number(),
    })),
  })).optional(),
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
    selections: z.array(z.object({
      option_id: z.string(),
      value_id: z.string(),
    })).optional(),
    lifecycle_state: z.enum(['active', 'inactive']).optional(),
    image_url: z.string().optional(),
    removed_at: z.coerce.date().optional(),
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
  shipping: createDraftProductResponseShippingSchema.optional(),
});
