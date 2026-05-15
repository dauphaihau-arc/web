import { z } from 'zod';
import { objectIdSchema } from '~/shared/schemas/sub/object-id.schema';
import { CATEGORY_CONFIG } from '~/shared/config/enums/category';

export const categorySchema = z.object({
  id: objectIdSchema,
  parent: objectIdSchema
    .nullable()
    .optional(),
  name: z
    .string()
    .min(1)
    .max(CATEGORY_CONFIG.MAX_CHAR_NAME),
  relative_url_image: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
