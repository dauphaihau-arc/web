import type { z } from 'zod';
import type {
  couponSchema,
  percentOffSchema
} from '~/shared/schemas/coupon.schema';

export type Coupon = z.infer<typeof couponSchema>;
export type PercentOff = z.infer<typeof percentOffSchema>;
