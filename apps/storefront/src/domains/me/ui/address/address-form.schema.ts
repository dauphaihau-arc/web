import { z } from 'zod';
import { ADDRESS_CONFIG } from '@arc/enums/address';
import { addressFormSchema as nameBasedAddressFormSchema } from '@arc/schemas/forms/address/address-form.schema';
import { guestCheckoutFormSchema } from '@arc/schemas/guest-checkout.schema';
import {
  isPhoneValid,
  isPostcodeValid,
  isUnchangedPhone,
  isUnchangedPostcode,
  normalizePhone,
  normalizePostcode,
  PHONE_INVALID,
  PHONE_REQUIRED,
  PHONE_TOO_LONG,
  POSTCODE_INVALID,
  POSTCODE_REQUIRED,
  POSTCODE_TOO_LONG,
} from './address-validation';

const COUNTRY_REQUIRED = 'Select a country';
const SUBDIVISION_REQUIRED = 'Select a state or province';
const SUBDIVISION_TOO_LONG = `Keep the state or province to ${ADDRESS_CONFIG.MAX_CHAR_CITY} characters or fewer`;

export interface AddressSchemaOptions {
  /** Accept a stored display name when no canonical country code was chosen. */
  allowLegacyCountry?: boolean

  /** Defer the subdivision requirement while a preserved legacy value is shown. */
  allowLegacySubdivision?: boolean

  /** Country selected in the form, resolved from the location reference data. */
  countryCode?: string

  /**
   * Whether the selected country requires a postcode. Addressed in the form
   * from `Country.postal_code_required`; defaults to required when unknown so
   * callers that do not supply a country keep the original behaviour.
   */
  postalCodeRequired?: boolean

  /**
   * Stored phone/postcode an update may keep untouched. A value equal to the
   * stored one skips the client rules so an unrelated edit can still save;
   * once the buyer changes it, the new value is validated normally.
   */
  preservePhone?: string
  preserveZip?: string
}

/**
 * Shared phone/postcode field shapes: normalize on parse, except for an
 * untouched stored value, which is passed through exactly as the row holds it.
 */
function postcodeField(options: AddressSchemaOptions) {
  return z
    .string()
    .optional()
    .transform(value =>
      isUnchangedPostcode(value, options.preserveZip)
        ? value
        : normalizePostcode(value));
}

function phoneField(options: AddressSchemaOptions) {
  return z
    .string({ required_error: PHONE_REQUIRED })
    .transform(value =>
      isUnchangedPhone(value, options.preservePhone)
        ? value
        : normalizePhone(value));
}

type ValidationValues = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- form state mirrors the API field name.
  country_code?: string
  phone?: string
  zip?: string
};

function addIssue(
  context: z.RefinementCtx,
  field: 'phone' | 'zip',
  message: string,
) {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: [field],
    message,
  });
}

function validatePostcode(
  value: ValidationValues,
  context: z.RefinementCtx,
  options: AddressSchemaOptions,
) {
  const zip = value.zip ?? '';

  if (isUnchangedPostcode(zip, options.preserveZip)) {
    return;
  }

  if (zip.length > ADDRESS_CONFIG.MAX_CHAR_ZIP) {
    addIssue(context, 'zip', POSTCODE_TOO_LONG);
    return;
  }

  if (!zip) {
    if (options.postalCodeRequired ?? true) {
      addIssue(context, 'zip', POSTCODE_REQUIRED);
    }
    return;
  }

  if (!isPostcodeValid(zip, value.country_code?.trim() || options.countryCode)) {
    addIssue(context, 'zip', POSTCODE_INVALID);
  }
}

function validatePhone(
  value: ValidationValues,
  context: z.RefinementCtx,
  options: AddressSchemaOptions,
) {
  const phone = value.phone ?? '';

  if (isUnchangedPhone(phone, options.preservePhone)) {
    return;
  }

  if (!phone) {
    addIssue(context, 'phone', PHONE_REQUIRED);
    return;
  }

  if (phone.length > ADDRESS_CONFIG.MAX_CHAR_PHONE) {
    addIssue(context, 'phone', PHONE_TOO_LONG);
    return;
  }

  const countryCode = value.country_code?.trim() || options.countryCode;

  if (!countryCode) {
    // The country field carries its own error; without it there is no dialling
    // plan to validate against and the server stays authoritative.
    return;
  }

  if (!isPhoneValid(phone, countryCode)) {
    addIssue(context, 'phone', PHONE_INVALID);
  }
}

/**
 * Saved addresses validate the canonical codes. The subdivision requirement
 * follows the selected country: a code where the country has administrative
 * areas, free text where it has none. The postcode requirement follows the
 * country's `postal_code_required` flag, and phone/postcode formats follow the
 * selected country.
 *
 * The update dialog allows a legacy country/subdivision to stay untouched:
 * `allowLegacyCountry` accepts a display name when no code was chosen, and
 * `allowLegacySubdivision` defers the subdivision requirement until the buyer
 * explicitly replaces a preserved value. `preservePhone`/`preserveZip` do the
 * same for stored values that no longer pass the current client rules.
 */
export function createCodedAddressFormSchema(
  hasAdministrativeAreas: boolean,
  options: AddressSchemaOptions = {},
) {
  return nameBasedAddressFormSchema
    .extend({
      country: z.string().optional(),
      state: z.string().optional(),
      country_code: z.string().optional(),
      state_code: z.string().optional(),
      state_text: options.allowLegacySubdivision
        ? z.string().optional()
        : z
          .string({ required_error: SUBDIVISION_REQUIRED })
          .max(ADDRESS_CONFIG.MAX_CHAR_CITY, SUBDIVISION_TOO_LONG)
          .optional(),
      zip: postcodeField(options),
      phone: phoneField(options),
    })
    .superRefine((value, context) => {
      if (
        !value.country_code
        && !(options.allowLegacyCountry && value.country?.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['country_code'],
          message: COUNTRY_REQUIRED,
        });
        return;
      }

      validatePostcode(value, context, options);
      validatePhone(value, context, options);

      if (hasAdministrativeAreas && !options.allowLegacySubdivision) {
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
 * subdivision, postcode and phone rules so the form UI can validate before the
 * guest address is converted back to display names.
 */
export function createGuestAddressFormSchema(
  hasAdministrativeAreas: boolean,
  options: AddressSchemaOptions = {},
) {
  return guestCheckoutFormSchema
    .extend({
      country_code: z.string().optional(),
      state: z.string().optional(),
      state_code: z.string().optional(),
      state_text: z
        .string()
        .max(ADDRESS_CONFIG.MAX_CHAR_CITY, SUBDIVISION_TOO_LONG)
        .optional(),
      zip: postcodeField(options),
      phone: phoneField(options),
    })
    .superRefine((value, context) => {
      validatePostcode(value, context, options);
      validatePhone(value, context, options);

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
