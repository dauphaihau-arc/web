import type { z } from 'zod';
import type { cartSchema, shopCartSchema, productCartSchema } from '~/shared/schemas/cart.schema';

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof shopCartSchema>;
export type ProductCart = z.infer<typeof productCartSchema>;
