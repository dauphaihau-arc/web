import { z } from 'zod';
import { ADDRESS_CONFIG } from '@arc/enums/address';
import { addressFormSchema as nameBasedAddressFormSchema } from '@arc/schemas/forms/address/address-form.schema';
import { guestCheckoutFormSchema } from '@arc/schemas/guest-checkout.schema';

const COUNTRY_REQUIRED = 'Select a country';
const SUBDIVISION_REQUIRED = 'Select a state or province';
const SUBDIVISION_TOO_LONG = `Keep the state or province to ${ADDRESS_CONFIG.MAX_CHAR_CITY} characters or fewer`;

/**
 * Saved addresses validate the canonical codes. The subdivision requirement
 * follows the selected country: a code where the country has administrative
 * areas, free text where it has none.
 */
export function createCodedAddressFormSchema(hasAdministrativeAreas: boolean) {
  return nameBasedAddressFormSchema
    .extend({
      country: z.string().optional(),
      state: z.string().optional(),
      country_code: z.string({ required_error: COUNTRY_REQUIRED }),
      state_code: z.string().optional(),
      state_text: z
        .string({ required_error: SUBDIVISION_REQUIRED })
        .max(ADDRESS_CONFIG.MAX_CHAR_CITY, SUBDIVISION_TOO_LONG)
        .optional(),
    })
    .superRefine((value, context) => {
      if (hasAdministrativeAreas) {
        if (!value.state_code) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['state_code'],
            message: SUBDIVISION_REQUIRED,
          });
        }
        return;
      }

      // Free-text subdivision is optional where the country has no list.
    });
}

/**
 * Guest checkout stays name-based (it never sends codes), but mirrors the same
 * subdivision rule so the form UI can validate before the guest address is
 * converted back to display names.
 */
export function createGuestAddressFormSchema(hasAdministrativeAreas: boolean) {
  return guestCheckoutFormSchema
    .extend({
      country_code: z.string().optional(),
      state: z.string().optional(),
      state_code: z.string().optional(),
      state_text: z
        .string()
        .max(ADDRESS_CONFIG.MAX_CHAR_CITY, SUBDIVISION_TOO_LONG)
        .optional(),
    })
    .superRefine((value, context) => {
      if (hasAdministrativeAreas) {
        if (!value.state?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['state'],
            message: SUBDIVISION_REQUIRED,
          });
        }
        return;
      }

      // Free-text subdivision is optional where the country has no list.
    });
}
