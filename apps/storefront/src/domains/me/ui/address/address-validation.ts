import { ADDRESS_CONFIG } from '@arc/enums/address';
import type { CountryCode } from 'libphonenumber-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { postcodeValidator, postcodeValidatorExistsForCountry } from 'postcode-validator';

export const PHONE_REQUIRED = 'Please enter a phone number';
export const PHONE_INVALID = 'Enter a valid phone number for the selected country';
export const PHONE_TOO_LONG = `Keep the phone number to ${ADDRESS_CONFIG.MAX_CHAR_PHONE} characters or fewer`;
export const POSTCODE_REQUIRED = 'Please enter the ZIP or postal code';
export const POSTCODE_INVALID = 'Enter a valid ZIP or postal code for the selected country';
export const POSTCODE_TOO_LONG = `Keep the ZIP or postal code to ${ADDRESS_CONFIG.MAX_CHAR_ZIP} characters or fewer`;

/**
 * Caller-supplied copy for the schema's field errors. Defaults keep the English
 * text used by non-UI callers and tests; the address form passes the catalog
 * values for the active locale.
 */
export interface AddressValidationMessages {
  phoneRequired: string
  phoneInvalid: string
  phoneTooLong: string
  postcodeRequired: string
  postcodeInvalid: string
  postcodeTooLong: string
}

export const DEFAULT_ADDRESS_VALIDATION_MESSAGES: AddressValidationMessages = {
  phoneRequired: PHONE_REQUIRED,
  phoneInvalid: PHONE_INVALID,
  phoneTooLong: PHONE_TOO_LONG,
  postcodeRequired: POSTCODE_REQUIRED,
  postcodeInvalid: POSTCODE_INVALID,
  postcodeTooLong: POSTCODE_TOO_LONG,
};

/**
 * Postcodes are free-form text now that the form accepts alphanumeric entries
 * (GB, CA, NL…): trim, collapse inner whitespace and uppercase before both
 * validation and submission so the stored value stays canonical.
 */
export function normalizePostcode(value: string | undefined | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function normalizePhone(value: string | undefined | null): string {
  return (value ?? '').trim();
}

/**
 * Validates against the country the buyer selected. `libphonenumber-js`
 * expects an uppercase ISO code; an unknown code yields no parse and therefore
 * an invalid number rather than a crash.
 */
export function isPhoneValid(value: string, countryCode: string | undefined): boolean {
  const phone = normalizePhone(value);

  if (!phone) {
    return false;
  }

  const normalizedCountry = countryCode?.trim().toUpperCase();

  const parsed = normalizedCountry
    ? parsePhoneNumberFromString(phone, normalizedCountry as CountryCode)
    : parsePhoneNumberFromString(phone);

  return parsed?.isValid() ?? false;
}

/**
 * Countries without a postcode rule keep free-form input. `postcode-validator`
 * throws on unknown codes, so existence is checked first.
 */
export function isPostcodeValid(value: string, countryCode: string | undefined): boolean {
  const normalizedCountry = countryCode?.trim().toUpperCase();

  if (!normalizedCountry || !postcodeValidatorExistsForCountry(normalizedCountry)) {
    return true;
  }

  return postcodeValidator(normalizePostcode(value), normalizedCountry);
}

export function isUnchangedPhone(value: string | undefined, stored: string | undefined): boolean {
  return stored !== undefined && normalizePhone(value) === normalizePhone(stored);
}

export function isUnchangedPostcode(value: string | undefined, stored: string | undefined): boolean {
  return stored !== undefined && normalizePostcode(value) === normalizePostcode(stored);
}
