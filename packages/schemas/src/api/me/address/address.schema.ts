import { z } from 'zod'
import { ADDRESS_CONFIG } from '@arc/enums/address'

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
})

export const createUserAddressRequestSchema = z.object({
  full_name: z
    .string({ required_error: 'Please enter the recipient’s full name' })
    .max(ADDRESS_CONFIG.MAX_CHAR_FULL_NAME, `Keep your name to ${ADDRESS_CONFIG.MAX_CHAR_FULL_NAME} characters or fewer`),
  address_1: z
    .string({ required_error: 'Please enter the street address' })
    .max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS, `Keep the street address to ${ADDRESS_CONFIG.MAX_CHAR_ADDRESS} characters or fewer`),
  address_2: z
    .string({ required_error: 'Please enter the second address line' })
    .max(ADDRESS_CONFIG.MAX_CHAR_ADDRESS, `Keep the second address line to ${ADDRESS_CONFIG.MAX_CHAR_ADDRESS} characters or fewer`)
    .optional(),
  city: z
    .string({ required_error: 'Please enter the city' })
    .max(ADDRESS_CONFIG.MAX_CHAR_CITY, `Keep the city to ${ADDRESS_CONFIG.MAX_CHAR_CITY} characters or fewer`),
  country: z.string({ required_error: 'Select a country' }),
  state: z.string({ required_error: 'Select a state or province' }),
  zip: z
    .string({ required_error: 'Please enter the ZIP or postal code' })
    .max(ADDRESS_CONFIG.MAX_CHAR_ZIP, `Keep the ZIP or postal code to ${ADDRESS_CONFIG.MAX_CHAR_ZIP} characters or fewer`),
  phone: z
    .string({ required_error: 'Please enter a phone number' })
    .max(ADDRESS_CONFIG.MAX_CHAR_PHONE, `Keep the phone number to ${ADDRESS_CONFIG.MAX_CHAR_PHONE} characters or fewer`),
  is_primary: z.boolean().optional(),
})

export const updateUserAddressBodySchema = createUserAddressRequestSchema.partial()

export const updateUserAddressRequestSchema = updateUserAddressBodySchema.extend({
  id: z.string(),
})

export const userAddressEnvelopeSchema = z.object({
  address: addressItemSchema,
})

export const userAddressListResponseSchema = z.object({
  results: z.array(addressItemSchema),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
})
