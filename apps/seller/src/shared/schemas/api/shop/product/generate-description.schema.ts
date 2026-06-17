import { z } from 'zod'
import {
  ProductVariantTypes,
  ProductWhoMade,
} from '@arc/enums/product'

export const generateProductDescriptionRequestAttributeSchema = z.object({
  category_attribute_id: z.string(),
  selected_option_id: z.string().optional(),
  selected_text: z.string().optional(),
})

export const generateProductDescriptionRequestSchema = z.object({
  title: z.string(),
  category_id: z.string().optional(),
  who_made: z.nativeEnum(ProductWhoMade).optional(),
  is_digital: z.boolean().optional(),
  variant_type: z.nativeEnum(ProductVariantTypes).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.array(generateProductDescriptionRequestAttributeSchema).optional(),
})

export const generateProductDescriptionResponseSchema = z.object({
  description: z.string(),
})
