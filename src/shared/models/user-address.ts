import type { z } from 'zod';
import type { userAddressSchema } from '~/shared/schemas/user-address.schema';

export type UserAddress = z.infer<typeof userAddressSchema>;
