import { z } from 'zod';
import { PRODUCT_SHIPPING_CHARGE, PRODUCT_SHIPPING_SERVICES } from '~/config/enums/product';
import { objectIdSchema } from '@/schemas/sub/objectId.schema';

export const productStandardShippingSchema = z.object({
  country: z.string(),
  service: z.nativeEnum(PRODUCT_SHIPPING_SERVICES).default(PRODUCT_SHIPPING_SERVICES.OTHER),
  delivery_time: z.string(),
  charge: z.nativeEnum(PRODUCT_SHIPPING_CHARGE).default(PRODUCT_SHIPPING_CHARGE.FREE_SHIPPING),
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
