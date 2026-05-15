import type { PAYMENT_TYPES } from '~/config/enums/order';

export type Payment = {
  type: PAYMENT_TYPES
  card_funding: string
  card_last4: number
  card_brand: string
  card_exp_month: number
  card_exp_year: number
};
