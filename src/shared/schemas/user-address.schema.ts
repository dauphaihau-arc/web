import { z } from 'zod';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';
import { ADDRESS_CONFIG } from '~/config/enums/address';

export const userAddressSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  full_name: z.string().max(ADDRESS_CONFIG.MAX_CHAR_FULL_NAME),
  address1: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS),
  address2: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS).optional(),
  city: z.string().max(ADDRESS_CONFIG.MAX_CHAR_CITY),
  country: z.string(),
  state: z.string(),
  zip: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ZIP),
  phone: z.string().max(ADDRESS_CONFIG.MAX_CHAR_PHONE),
  is_primary: z.boolean().optional(),
  updated_at: z.date(),
  created_at: z.date(),
});

export const createUserAddressSchema = userAddressSchema.pick({
  full_name: true,
  address1: true,
  address2: true,
  city: true,
  country: true,
  state: true,
  zip: true,
  phone: true,
  is_primary: true,
});
