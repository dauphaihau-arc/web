import { z } from 'zod';
import { idSchema } from '~/shared/schemas/primitives/id.schema';

export const categoryAttributeSchema = z.object({
  id: idSchema,
  category: idSchema,
  name: z.string(),
  options: z.array(z.string()).optional(),
  updated_at: z.date(),
  created_at: z.date(),
});
