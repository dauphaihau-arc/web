import { z } from 'zod';
import { ADDRESS_CONFIG } from '~/shared/config/enums/address';

export const addressItemSchema = z.object({
  id: z.string(),
  user: z.string(),
  full_name: z.string().max(ADDRESS_CONFIG.MAX_CHAR_FULL_NAME),
  address_1: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS),
  address_2: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS).optional(),
  city: z.string().max(ADDRESS_CONFIG.MAX_CHAR_CITY),
  country: z.string(),
  state: z.string(),
  zip: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ZIP),
  phone: z.string().max(ADDRESS_CONFIG.MAX_CHAR_PHONE),
  is_primary: z.boolean().optional(),
  updated_at: z.date(),
  created_at: z.date(),
});

export const createUserAddressRequestSchema = z.object({
  full_name: z.string().max(ADDRESS_CONFIG.MAX_CHAR_FULL_NAME),
  address_1: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS),
  address_2: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS).optional(),
  city: z.string().max(ADDRESS_CONFIG.MAX_CHAR_CITY),
  country: z.string(),
  state: z.string(),
  zip: z.string().max(ADDRESS_CONFIG.MAX_CHAR_ZIP),
  phone: z.string().max(ADDRESS_CONFIG.MAX_CHAR_PHONE),
  is_primary: z.boolean().optional(),
});

export const updateUserAddressBodySchema = createUserAddressRequestSchema.partial();

export const updateUserAddressRequestSchema = updateUserAddressBodySchema.extend({
  id: z.string(),
});

export const userAddressEnvelopeSchema = z.object({
  address: addressItemSchema,
});

export const userAddressListResponseSchema = z.object({
  results: z.array(addressItemSchema),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
});
