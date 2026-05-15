import type { z } from 'zod';
import type { userSchema } from '~/schemas/user.schema';

export type User = z.infer<typeof userSchema>;

export type UpdateUserBody = Partial<Pick<User, 'name' | 'email' | 'password' | 'market_preferences'>>;
