import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'
import { CATEGORY_CONFIG } from '@arc/enums/category'

export const categorySchema = z.object({
  id: idSchema,
  parent: idSchema
    .nullable()
    .optional(),
  name: z
    .string()
    .min(1)
    .max(CATEGORY_CONFIG.MAX_CHAR_NAME),
  relative_url_image: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
})
