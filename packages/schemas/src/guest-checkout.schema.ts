import { z } from 'zod'
import { createUserAddressRequestSchema } from './api/me/address/address.schema'

export const guestCheckoutAddressSchema = createUserAddressRequestSchema.omit({
  is_primary: true,
})

export const guestCheckoutContactSchema = z.object({
  email: z.string().email().max(320),
})

export const guestCheckoutFormSchema = guestCheckoutAddressSchema.extend({
  email: guestCheckoutContactSchema.shape.email,
})

export type GuestCheckoutAddress = z.infer<typeof guestCheckoutAddressSchema>
export type GuestCheckoutForm = z.infer<typeof guestCheckoutFormSchema>
