import { z } from 'zod'
import { ProductShippingCharge, ProductShippingServices } from '@arc/enums/product'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const productStandardShippingSchema = z.object({
  country: z.string(),
  service: z.nativeEnum(ProductShippingServices).default(ProductShippingServices.OTHER),
  delivery_time: z.string(),
  charge: z.nativeEnum(ProductShippingCharge).default(ProductShippingCharge.FREE_SHIPPING),
})

export const productShippingSchema = z.object({
  id: idSchema,
  shop: idSchema,
  product: idSchema,
  country: z.string(),
  zip: z.string().max(10),
  process_time: z.string(),
  standard_shipping: z.array(productStandardShippingSchema),
  created_at: z.date(),
  updated_at: z.date(),
})
