import type { z } from 'zod';
import type { userSchema } from '~/shared/schemas/user.schema';

export type User = z.infer<typeof userSchema>;
