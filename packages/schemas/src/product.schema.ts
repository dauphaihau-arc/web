import { z } from 'zod'
import {
  ProductStates,
  PRODUCT_REGEX_SLUG,
  PRODUCT_REGEX_NOT_URL,
  ProductWhoMade,
  PRODUCT_CONFIG,
  ProductVariantTypes,
} from '@arc/enums/product'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const productImageSchema = z.object({
  id: idSchema,
  relative_url: z
    .string()
    .startsWith('shop', 'must start with shop')
    .regex(PRODUCT_REGEX_NOT_URL, 'must not absolute url'),
  rank: z
    .number()
    .min(PRODUCT_CONFIG.MIN_IMAGES)
    .max(PRODUCT_CONFIG.MAX_IMAGES)
    .default(1),
})

export const productAttributeSchema = z.object({
  attribute: idSchema,
  selected: z.string(),
})

export const baseProductSchema = z.object({
  id: idSchema,
  shop: idSchema,
  category: idSchema,
  shipping: idSchema,
  variant_type: z
    .nativeEnum(ProductVariantTypes)
    .default(ProductVariantTypes.NONE),
  attributes: z.array(productAttributeSchema),
  title: z
    .string()
    .min(PRODUCT_CONFIG.MIN_CHAR_TITLE, `Title must contain at least ${PRODUCT_CONFIG.MIN_CHAR_TITLE} characters`)
    .max(PRODUCT_CONFIG.MAX_CHAR_TITLE),
  description: z
    .string()
    .min(PRODUCT_CONFIG.MIN_CHAR_DESCRIPTION, `Description must contain at least ${PRODUCT_CONFIG.MIN_CHAR_DESCRIPTION} characters`)
    .max(PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION),
  slug: z
    .string()
    .regex(PRODUCT_REGEX_SLUG, 'invalid slug')
    .optional(),
  tags: z.array(
    z.string()
      .min(PRODUCT_CONFIG.MIN_CHAR_TAG)
      .max(PRODUCT_CONFIG.MAX_CHAR_TAG),
  )
    .max(PRODUCT_CONFIG.MAX_TAGS)
    .default([]),
  state: z
    .nativeEnum(ProductStates)
    .default(ProductStates.ACTIVE),
  is_digital: z
    .boolean()
    .default(false),
  who_made: z
    .nativeEnum(ProductWhoMade)
    .default(ProductWhoMade.I_DID),
  views: z
    .number()
    .optional(),
  non_taxable: z
    .boolean()
    .default(false)
    .optional(),
  images: z
    .array(productImageSchema)
    .min(PRODUCT_CONFIG.MIN_IMAGES)
    .max(PRODUCT_CONFIG.MAX_IMAGES),
  rating_average: z
    .number()
    .min(0, 'Rating must be more than 0')
    .max(5, 'Rating must be equal or less than 5.0')
    .default(0)
    .optional(),
  updated_at: z.date(),
  created_at: z.date(),
})

const noneVariantSchema = z.object({
  variant_type: z.literal(ProductVariantTypes.NONE),
  inventory: idSchema,
})

export const singleVariantSchema = z.object({
  variant_type: z.literal(ProductVariantTypes.SINGLE),
  variants: z.array(idSchema),
  variant_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME),
})

export const combineVariantSchema = z.object({
  variant_type: z.literal(ProductVariantTypes.COMBINE),
  variants: z.array(idSchema),
  variant_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME),
  variant_sub_group_name: z
    .string()
    .min(1)
    .max(PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME),
})

const conditionVariantTypeSchema = z.discriminatedUnion(
  'variant_type', [
    noneVariantSchema,
    singleVariantSchema,
    combineVariantSchema,
  ],
)

export const productSchema = z.intersection(conditionVariantTypeSchema, baseProductSchema)

export const productStateUserCanModify = z.union([
  z.literal(ProductStates.ACTIVE),
  z.literal(ProductStates.INACTIVE),
  z.literal(ProductStates.DRAFT),
]).default(ProductStates.ACTIVE)
