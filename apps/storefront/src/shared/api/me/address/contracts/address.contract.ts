import type { z } from 'zod'
import type {
  addressItemSchema,
  createUserAddressRequestSchema,
  updateUserAddressBodySchema,
  updateUserAddressRequestSchema,
  userAddressEnvelopeSchema,
  userAddressListResponseSchema,
} from '@arc/schemas/api/me/address/address.schema'

export type UserAddressItem = z.infer<typeof addressItemSchema>
export type GetUserAddressesResponse = z.infer<typeof userAddressListResponseSchema>
export type CreateUserAddressRequest = z.infer<typeof createUserAddressRequestSchema>
export type CreateUserAddressResponse = z.infer<typeof userAddressEnvelopeSchema>
export type UpdateUserAddressBody = z.infer<typeof updateUserAddressBodySchema>
export type UpdateUserAddressRequest = z.infer<typeof updateUserAddressRequestSchema>
export type UpdateUserAddressResponse = z.infer<typeof userAddressEnvelopeSchema>
export type DeleteUserAddressRequest = {
  id: UserAddressItem['id']
}
