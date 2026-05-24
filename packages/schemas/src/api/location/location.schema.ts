import { z } from 'zod'

export const countrySchema = z.object({
  name: z.string(),
  Iso2: z.string().optional(),
})

export const getCountriesResponseSchema = z.object({
  data: z.array(countrySchema),
})

export const getStatesByCountryRequestSchema = z.object({
  country: z.string().optional(),
})

export const stateSchema = z.object({
  name: z.string(),
})

export const getStatesByCountryResponseSchema = z.object({
  data: z.object({
    states: z.array(stateSchema),
  }),
})
