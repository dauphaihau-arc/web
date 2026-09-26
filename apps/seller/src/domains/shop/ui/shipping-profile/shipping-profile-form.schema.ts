import { z } from 'zod';
import {
  SHIPPING_PROFILE_CONFIG,
  ShippingDestinationScopes,
  ShippingProfileStatuses,
} from '@arc/enums/shipping';
import { shippingDestinationScopeSchema } from '@arc/schemas/shipping-profile.schema';

/**
 * Editing never changes lifecycle to archived: archiving is its own explicit
 * action with its own in-use protection.
 */
export const shippingProfileFormStatusSchema = z.union([
  z.literal(ShippingProfileStatuses.DRAFT),
  z.literal(ShippingProfileStatuses.ACTIVE),
]);
export const shippingProfileFormRateSchema = z.object({
  /** Client-only identity so rate rows keep stable Vue keys while editing. */
  localId: z.string().optional(),
  destination_scope: shippingDestinationScopeSchema,
  destination_country: z.string().optional(),
  one_item_fee: z.number().min(0),
  additional_item_fee: z.number().min(0),
  delivery_time_min_days: z.number().int().min(0).optional(),
  delivery_time_max_days: z.number().int().min(0).optional(),
}).superRefine((rate, ctx) => {
  if (rate.destination_scope !== ShippingDestinationScopes.EVERYWHERE_ELSE && !rate.destination_country) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a country',
      path: ['destination_country'],
    });
  }

  const hasDeliveryMin = rate.delivery_time_min_days !== undefined && rate.delivery_time_min_days !== null;
  const hasDeliveryMax = rate.delivery_time_max_days !== undefined && rate.delivery_time_max_days !== null;

  if (hasDeliveryMin !== hasDeliveryMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery time needs both a minimum and a maximum in calendar days',
      path: ['delivery_time_min_days'],
    });
    return;
  }

  if (hasDeliveryMin && hasDeliveryMax && rate.delivery_time_min_days! > rate.delivery_time_max_days!) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Delivery time minimum must not exceed the maximum',
      // Anchored to the pair's field row: the row is named after the minimum,
      // and an error path with no group renders nowhere.
      path: ['delivery_time_min_days'],
    });
  }
});

const MIN_POSTAL_CHAR = SHIPPING_PROFILE_CONFIG.MIN_POSTAL_CHAR;
const MAX_POSTAL_CHAR = SHIPPING_PROFILE_CONFIG.MAX_POSTAL_CHAR;
const POSTAL_CHAR_RANGE_MESSAGE = `Postal code must be between ${MIN_POSTAL_CHAR} and ${MAX_POSTAL_CHAR} characters`;

/** Mirrors the domain rule: permissive charset, because formats are country-specific. */
const postalCodeSchema = z
  .string()
  .trim()
  .min(MIN_POSTAL_CHAR, POSTAL_CHAR_RANGE_MESSAGE)
  .max(MAX_POSTAL_CHAR, POSTAL_CHAR_RANGE_MESSAGE)
  .regex(/^[A-Za-z0-9 -]+$/, 'Postal code can only contain letters, numbers, spaces, and hyphens');

/**
 * The root schema stays a plain object: Nuxt UI's form adapter maps Zod errors
 * by object shape, and a root-level `superRefine` (ZodEffects) breaks that
 * mapping so submission never fires. Cross-field Processing-time rules are
 * enforced by the editor's readiness issues and, authoritatively, by the API.
 */
export const shippingProfileFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Enter a profile name')
    .max(
      SHIPPING_PROFILE_CONFIG.MAX_NAME_CHAR,
      `Profile name must be ${SHIPPING_PROFILE_CONFIG.MAX_NAME_CHAR} characters or fewer`,
    ),
  status: shippingProfileFormStatusSchema,
  ship_from_country: z.string().optional(),
  // A cleared box is an absent postal code, not a too-short one.
  ship_from_postal: z.preprocess(
    value => (typeof value === 'string' && value.trim().length === 0 ? undefined : value),
    postalCodeSchema.optional(),
  ),
  processing_time_min_days: z.number().int().min(0).optional(),
  processing_time_max_days: z.number().int().min(0).optional(),
  rates: z.array(shippingProfileFormRateSchema).min(1, 'Add at least one destination rate'),
});

export type ShippingProfileFormRate = z.infer<typeof shippingProfileFormRateSchema>;
export type ShippingProfileFormState = z.infer<typeof shippingProfileFormSchema>;
