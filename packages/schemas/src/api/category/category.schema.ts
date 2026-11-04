import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const categoryAttributeOptionResponseSchema = z.object({
  id: idSchema,
  value: z.string(),
  rank: z.number(),
})

export const categoryAttributeSelectSchema = z.object({
  id: idSchema,
  key: z.string().optional(),
  name: z.string(),
  options: z.array(z.object({
    id: idSchema,
    value: z.string(),
  })).optional(),
})

export const nestedCategoryAttributeSchema = z.object({
  id: idSchema,
  key: z.string(),
  name: z.string(),
  options: z.array(categoryAttributeOptionResponseSchema),
})

/**
 * The contract declares a single attribute shape, but the seller and storefront
 * clients still tolerate the older flat `{ id, value }` option list, so the
 * boundary type has to describe both server generations.
 */
export const getCategoryAttributesResponseSchema = z.union([
  z.object({ attributes: z.array(categoryAttributeSelectSchema) }),
  z.object({ attributes: z.array(nestedCategoryAttributeSchema) }),
])
