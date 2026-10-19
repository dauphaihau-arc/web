import type { z } from 'zod';
import type { shopFinancePayableSchema } from '@arc/schemas/api/shop/finance/payable.schema';

export type ShopFinancePayable = z.infer<typeof shopFinancePayableSchema>;
