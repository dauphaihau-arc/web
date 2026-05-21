import type { z } from 'zod';
import type {
  countrySchema,
  getCountriesResponseSchema,
  getStatesByCountryRequestSchema,
  getStatesByCountryResponseSchema,
  stateSchema
} from '~/shared/schemas/api/location/location.schema';

export type Country = z.infer<typeof countrySchema>;
export type State = z.infer<typeof stateSchema>;
export type GetCountriesResponse = z.infer<typeof getCountriesResponseSchema>;
export type GetStatesByCountryRequest = z.infer<typeof getStatesByCountryRequestSchema>;
export type GetStatesByCountryResponse = z.infer<typeof getStatesByCountryResponseSchema>;
