import { z } from 'zod'
import { createUserAddressRequestSchema } from './api/me/address/address.schema'

export const guestCheckoutAddressSchema = createUserAddressRequestSchema.omit({
  is_primary: true,
})

export const guestCheckoutContactSchema = z.object({
  email: z
    .string({
      required_error: 'Please enter your email address',
      invalid_type_error: 'Please enter your email address',
    })
    .trim()
    .max(320, 'That email address is too long')
    .email('Enter a full email address, like name@example.com'),
})

export const guestCheckoutFormSchema = guestCheckoutAddressSchema.extend({
  email: guestCheckoutContactSchema.shape.email,
})

export type GuestCheckoutAddress = z.infer<typeof guestCheckoutAddressSchema>
export type GuestCheckoutForm = z.infer<typeof guestCheckoutFormSchema>
