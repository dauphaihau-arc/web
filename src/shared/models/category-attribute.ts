import type { z } from 'zod';
import type { categoryAttributeSchema } from '~/shared/schemas/category-attribute.schema';

export type CategoryAttribute = z.infer<typeof categoryAttributeSchema>;
