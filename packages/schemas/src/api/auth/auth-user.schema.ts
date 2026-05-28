import { z } from 'zod'
import {
  MarketCurrencies,
  MarketLanguages,
  MarketRegions,
} from '@arc/enums/market'

export const authPreferencesSchema = z.object({
  region: z.nativeEnum(MarketRegions),
  language: z.nativeEnum(MarketLanguages),
  currency: z.nativeEnum(MarketCurrencies),
})

export const authShopSchema = z.object({
  id: z.string(),
  public_id: z.string().optional(),
  owner_user_id: z.string().optional(),
  shop_name: z.string(),
  status: z.string().optional(),
})

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string().optional(),
  status: z.string(),
  session_id: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  preferences: authPreferencesSchema.optional(),
  shop: authShopSchema.optional(),
})

export const authUserEnvelopeSchema = z.object({
  user: authUserSchema,
})

export const currentUserShopSchema = z.object({
  shop_name: z.string(),
})

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string().optional(),
  permissions: z.array(z.string()),
  preferences: authPreferencesSchema.optional(),
  shop: currentUserShopSchema.optional(),
})

export const currentUserEnvelopeSchema = z.object({
  user: currentUserSchema,
})
