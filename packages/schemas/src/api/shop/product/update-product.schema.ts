import { z } from 'zod'
import { updateProductFormSchema } from '@arc/schemas/forms/shop/product/update-product-form.schema'

export const updateProductRequestBodySchema = updateProductFormSchema.extend({
  images: z.array(z.object({
    id: z.string().optional(),
    relative_url: z.string().optional(),
    rank: z.number().optional(),
  })).optional(),
})

export const updateProductRequestSchema = z.object({
  id: z.string(),
  body: updateProductRequestBodySchema,
})
