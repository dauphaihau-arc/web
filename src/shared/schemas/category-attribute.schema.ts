import { z } from 'zod';
import { objectIdSchema } from '~/shared/schemas/sub/object-id.schema';

export const categoryAttributeSchema = z.object({
  id: objectIdSchema,
  category: objectIdSchema,
  name: z.string(),
  options: z.array(z.string()).optional(),
  updated_at: z.date(),
  created_at: z.date(),
});
