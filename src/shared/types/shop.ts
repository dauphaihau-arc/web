import type { z } from 'zod';
import type { shopSchema } from '~/shared/schemas/shop.schema';

export type Shop = z.infer<typeof shopSchema>;
