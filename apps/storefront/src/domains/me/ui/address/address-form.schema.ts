import { z } from 'zod';
import { ADDRESS_CONFIG } from '@arc/enums/address';
import { addressFormSchema as baseAddressFormSchema } from '@arc/schemas/forms/address/address-form.schema';
import { guestCheckoutFormSchema } from '@arc/schemas/guest-checkout.schema';
import {
  DEFAULT_ADDRESS_VALIDATION_MESSAGES,
  isPhoneValid,
  isPostcodeValid,
  isUnchangedPhone,
  isUnchangedPostcode,
  normalizePhone,
  normalizePostcode,
  type AddressValidationMessages,
} from './address-validation';

const COUNTRY_REQUIRED = 'Select a country';
const SUBDIVISION_REQUIRED = 'Select a state or province';
const SUBDIVISION_TOO_LONG = `Keep the state or province to ${ADDRESS_CONFIG.MAX_CHAR_CITY} characters or fewer`;

export interface AddressSchemaMessages extends AddressValidationMessages {
  countryRequired: string
  subdivisionRequired: string
  subdivisionTooLong: string
}

const DEFAULT_ADDRESS_SCHEMA_MESSAGES: AddressSchemaMessages = {
  ...DEFAULT_ADDRESS_VALIDATION_MESSAGES,
  countryRequired: COUNTRY_REQUIRED,
  subdivisionRequired: SUBDIVISION_REQUIRED,
  subdivisionTooLong: SUBDIVISION_TOO_LONG,
};

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

  /** Whether the form renders the subdivision field for the selected country. */
  subdivisionVisible?: boolean

  /** Whether the form renders the postcode field for the selected country. */
  postcodeVisible?: boolean

  /**
   * Stored phone/postcode an update may keep untouched. A value equal to the
   * stored one skips the client rules so an unrelated edit can still save;
   * once the buyer changes it, the new value is validated normally.
   */
  preservePhone?: string
  preserveZip?: string

  /** Localized copy for the schema's validation issues. */
  messages?: Partial<AddressSchemaMessages>
}

/**
 * Shared phone/postcode field shapes: normalize on parse, except for an
 * untouched stored value, which is passed through exactly as the row holds it.
 */
function resolveMessages(options: AddressSchemaOptions): AddressSchemaMessages {
  return { ...DEFAULT_ADDRESS_SCHEMA_MESSAGES, ...options.messages };
}

function postcodeField(options: AddressSchemaOptions) {
  return z
    .string()
    .optional()
    .transform((value) => {
      if (options.postcodeVisible === false) {
        // A country without postcodes never serializes whatever stale value
        // the form state may still hold.
        return '';
      }

      return isUnchangedPostcode(value, options.preserveZip)
        ? value
        : normalizePostcode(value);
    });
}

function phoneField(options: AddressSchemaOptions, messages: AddressSchemaMessages) {
  return z
    .string({ error: messages.phoneRequired })
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
  messages: AddressSchemaMessages,
) {
  if (options.postcodeVisible === false) {
    return;
  }

  const zip = value.zip ?? '';

  if (isUnchangedPostcode(zip, options.preserveZip)) {
    return;
  }

  if (zip.length > ADDRESS_CONFIG.MAX_CHAR_ZIP) {
    addIssue(context, 'zip', messages.postcodeTooLong);
    return;
  }

  if (!zip) {
    if (options.postalCodeRequired ?? true) {
      addIssue(context, 'zip', messages.postcodeRequired);
    }
    return;
  }

  if (!isPostcodeValid(zip, value.country_code?.trim() || options.countryCode)) {
    addIssue(context, 'zip', messages.postcodeInvalid);
  }
}

function validatePhone(
  value: ValidationValues,
  context: z.RefinementCtx,
  options: AddressSchemaOptions,
  messages: AddressSchemaMessages,
) {
  const phone = value.phone ?? '';

  if (isUnchangedPhone(phone, options.preservePhone)) {
    return;
  }

  if (!phone) {
    addIssue(context, 'phone', messages.phoneRequired);
    return;
  }

  if (phone.length > ADDRESS_CONFIG.MAX_CHAR_PHONE) {
    addIssue(context, 'phone', messages.phoneTooLong);
    return;
  }

  const countryCode = value.country_code?.trim() || options.countryCode;

  if (!countryCode) {
    // The country field carries its own error; without it there is no dialling
    // plan to validate against and the server stays authoritative.
    return;
  }

  if (!isPhoneValid(phone, countryCode)) {
    addIssue(context, 'phone', messages.phoneInvalid);
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
  const messages = resolveMessages(options);

  return baseAddressFormSchema
    .extend({
      country: z.string().optional(),
      state: z.string().optional(),
      country_code: z.string().optional(),
      state_code: z.string().optional(),
      state_text: options.allowLegacySubdivision
        ? z.string().optional()
        : z
          .string({ error: messages.subdivisionRequired })
          .max(ADDRESS_CONFIG.MAX_CHAR_CITY, messages.subdivisionTooLong)
          .optional(),
      zip: postcodeField(options),
      phone: phoneField(options, messages),
    })
    .superRefine((value, context) => {
      if (
        !value.country_code
        && !(options.allowLegacyCountry && value.country?.trim())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['country_code'],
          message: messages.countryRequired,
        });
        return;
      }

      validatePostcode(value, context, options, messages);
      validatePhone(value, context, options, messages);

      if (
        hasAdministrativeAreas
        && options.subdivisionVisible !== false
        && !options.allowLegacySubdivision
      ) {
        if (!value.state_code) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['state_code'],
            message: messages.subdivisionRequired,
          });
        }
        return;
      }

      // Free-text subdivision is optional where the country has no list.
    });
}

/**
 * Guest checkout writes the same canonical codes as a saved address; display
 * names stay local to the form. It mirrors the saved form's subdivision,
 * postcode and phone rules so the buyer sees the same validation.
 */
export function createGuestAddressFormSchema(
  hasAdministrativeAreas: boolean,
  options: AddressSchemaOptions = {},
) {
  const messages = resolveMessages(options);

  return guestCheckoutFormSchema
    .extend({
      country: z.string().optional(),
      state: z.string().optional(),
      state_code: z.string().optional(),
      state_text: z
        .string()
        .max(ADDRESS_CONFIG.MAX_CHAR_CITY, messages.subdivisionTooLong)
        .optional(),
      zip: postcodeField(options),
      phone: phoneField(options, messages),
    })
    .superRefine((value, context) => {
      validatePostcode(value, context, options, messages);
      validatePhone(value, context, options, messages);

      if (
        hasAdministrativeAreas
        && options.subdivisionVisible !== false
        && !options.allowLegacySubdivision
      ) {
        if (!value.state_code) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['state_code'],
            message: messages.subdivisionRequired,
          });
        }
        return;
      }

      // Free-text subdivision is optional where the country has no list.
    });
}
