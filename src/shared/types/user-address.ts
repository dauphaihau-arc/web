import type { z } from 'zod';
import type { userAddressSchema, createUserAddressSchema } from '~/shared/schemas/user-address.schema';

export type UserAddress = z.infer<typeof userAddressSchema>;

export type CreateBodyUserAddressBody = z.infer<typeof createUserAddressSchema>;

export type ResponseGetCountries = {
  data: {
    name: string
    Iso2?: string
  }[]
};

export type ResponseGetStatesByCountry = {
  data: {
    states: {
      name: string
    }[]
  }
};
