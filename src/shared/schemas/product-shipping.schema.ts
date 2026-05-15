import { z } from 'zod';
import { ProductShippingCharge, ProductShippingServices } from '~/shared/config/enums/product';
import { objectIdSchema } from '~/shared/schemas/sub/object-id.schema';

export const productStandardShippingSchema = z.object({
  country: z.string(),
  service: z.nativeEnum(ProductShippingServices).default(ProductShippingServices.OTHER),
  delivery_time: z.string(),
  charge: z.nativeEnum(ProductShippingCharge).default(ProductShippingCharge.FREE_SHIPPING),
});

export const productShippingSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  product: objectIdSchema,
  country: z.string(),
  zip: z.string().max(10),
  process_time: z.string(),
  standard_shipping: z.array(productStandardShippingSchema),
  created_at: z.date(),
  updated_at: z.date(),
});
