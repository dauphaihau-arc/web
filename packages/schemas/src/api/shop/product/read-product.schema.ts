import { z } from 'zod'
import { ProductStates, ProductVariantTypes } from '@arc/enums/product'

const requestGetListParamsSchema = z.object({
  page: z.union([z.number(), z.any()]).optional(),
  limit: z.number().optional(),
  populate: z.string().optional(),
  select: z.string().optional(),
  sortBy: z.string().optional(),
})

export const listShopProductsRequestSchema = requestGetListParamsSchema.extend({
  title: z.string().optional(),
})

export const listShopProductsItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  state: z.nativeEnum(ProductStates).optional(),
  variant_type: z.nativeEnum(ProductVariantTypes).optional(),
  images: z.array(z.object({
    id: z.string(),
    storage_key: z.string(),
    url: z.string().optional(),
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
    price: z.number(),
    sale_price: z.number().optional(),
  })),
})

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
})

export const shopProductDetailApiResponseSchema = z.object({
  id: z.string(),
  categoryId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  whoMade: z.string(),
  isDigital: z.boolean(),
  variantType: z.string().optional(),
  variantGroupName: z.string().optional(),
  variantSubGroupName: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    storageKey: z.string(),
    rank: z.number(),
    url: z.string().optional(),
  })),
  attributes: z.array(z.object({
    id: z.string(),
    categoryAttributeId: z.string(),
    selectedOptionId: z.string().optional(),
    selectedText: z.string().optional(),
  })),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    optionValue1: z.string().optional(),
    optionValue2: z.string().optional(),
    rank: z.number(),
  })),
  inventory: z.array(z.object({
    id: z.string(),
    productVariantId: z.string().optional(),
    sku: z.string().optional(),
    stock: z.number(),
    price: z.number(),
    salePrice: z.number().optional(),
  })),
})

export const detailShopProductInventorySchema = z.object({
  id: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),
  sku: z.string().optional(),
  sale_price: z.number().optional(),
})

export const detailShopProductVariantOptionSchema = z.object({
  id: z.string(),
  variant: z.object({
    id: z.string(),
    variant_name: z.string(),
  }),
  inventory: detailShopProductInventorySchema,
})

export const detailShopProductVariantSchema = z.object({
  id: z.string(),
  variant_name: z.string(),
  inventory: detailShopProductInventorySchema.optional(),
  variant_options: z.array(detailShopProductVariantOptionSchema).optional(),
})

export const detailShopProductResponseSchema = z.object({
  product: z.object({
    id: z.string(),
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
})

export const issueProductImageUploadUrlRequestSchema = z.object({
  productId: z.string(),
  content_type: z.string(),
  asset_type: z.literal('original').optional(),
})

export const issueProductImageUploadUrlResponseSchema = z.object({
  key: z.string(),
  presigned_url: z.string(),
  method: z.literal('PUT').optional(),
})

export const removeProductRequestSchema = z.object({
  id: z.string(),
})
