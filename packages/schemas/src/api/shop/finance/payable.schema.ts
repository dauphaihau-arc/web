import { z } from 'zod'

/**
 * A shop's Seller Payable, in the shop's Settlement Currency. Amounts are integer
 * minor units; the `available` part can be paid out now, the remainder is still
 * being held until every required unit of the Order it came from is delivered.
 */
export const shopFinancePayableSchema = z.object({
  currency: z.string(),
  available_minor: z.number().int(),
  not_yet_available_minor: z.number().int(),
})
