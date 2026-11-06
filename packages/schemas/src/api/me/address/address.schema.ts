import { z } from 'zod'
import { ADDRESS_CONFIG } from '@arc/enums/address'

/**
 * Runtime schema for the address form, shared by the account and guest
 * checkout dialogs. Response and update types are derived from the generated
 * OpenAPI contract (`MyAddressResponseDto`, `MyAddressListResponseDto`,
 * `CreateMyAddressDto`, `UpdateMyAddressDto`); this schema stays because the
 * form validates user input at runtime with its own messages and limits.
 */
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
  country_code: z.string({ required_error: 'Select a country' }),
  state_code: z.string().optional(),
  state_text: z.string().optional(),
  zip: z
    .string({ required_error: 'Please enter the ZIP or postal code' })
    .max(ADDRESS_CONFIG.MAX_CHAR_ZIP, `Keep the ZIP or postal code to ${ADDRESS_CONFIG.MAX_CHAR_ZIP} characters or fewer`),
  phone: z
    .string({ required_error: 'Please enter a phone number' })
    .max(ADDRESS_CONFIG.MAX_CHAR_PHONE, `Keep the phone number to ${ADDRESS_CONFIG.MAX_CHAR_PHONE} characters or fewer`),
  is_primary: z.boolean().optional(),
})
