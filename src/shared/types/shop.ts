import type { z } from 'zod';
import type { shopSchema } from '~/schemas/shop.schema';

export type Shop = z.infer<typeof shopSchema>;
