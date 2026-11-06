import type { GuestCheckoutAddress } from '@arc/schemas/guest-checkout.schema';
import type { AdministrativeArea, Country } from '~/domains/location/api/contracts/location.contract';
import { findAdministrativeArea } from '~/domains/location/utils/find-administrative-area';
import { findCountry } from '~/domains/location/utils/find-country-code';
import type { CreateUserAddressRequest } from '~/domains/me/api/address/contracts/address.contract';
import type { AddressFormState } from './address-form.types';

/**
 * Fills the code fields the form edits from a saved row that may predate them.
 * A country/subdivision is matched by code or display name from the Arc
 * reference data; when nothing resolves the original name is left untouched so
 * the legacy name-based request stays valid.
 *
 * `preserveLegacySubdivision` leaves an existing row's subdivision label alone
 * so the update dialog can require an explicit replacement choice.
 */
export function hydrateAddressCodes(
  state: AddressFormState,
  countries: Country[] | undefined,
  areas: AdministrativeArea[] | undefined,
  options: { preserveLegacySubdivision?: boolean } = {},
): void {
  const country = findCountry(countries, state.country_code ?? state.country);

  if (!country) {
    return;
  }

  state.country_code = country.code;
  state.country = country.name;

  if (!country.has_administrative_areas) {
    if (!state.state_text && state.state) {
      state.state_text = state.state;
    }
    return;
  }

  if (options.preserveLegacySubdivision && !state.state_code) {
    // Existing rows keep their legacy subdivision until the buyer explicitly
    // chooses a value from the country's list.
    return;
  }

  const area = findAdministrativeArea(areas, state.state_code ?? state.state);

  if (area) {
    state.state_code = area.code;
    state.state = area.name;
  }
}

export interface SavedAddressRequestOptions {
  /** Omit the country selection so an untouched legacy country is preserved. */
  omitCountry?: boolean

  /** Omit the subdivision selection so an untouched legacy value is preserved. */
  omitSubdivision?: boolean
}

/**
 * Builds the saved-address payload from canonical codes only: `country_code`
 * is the write identity and the subdivision is a `state_code` or free-text
 * `state_text`. Display names in the form state stay local to the UI.
 *
 * The update dialog omits location fields that the buyer did not touch so the
 * server preserves stored text and inactive codes exactly as they are.
 */
export function toSavedAddressRequest(
  state: AddressFormState,
  options: SavedAddressRequestOptions = {},
): CreateUserAddressRequest {
  const request: AddressFormState = { ...state };
  delete request.email;
  delete request.country;
  delete request.country_code;
  delete request.state;
  delete request.state_code;
  delete request.state_text;

  const location: Partial<Pick<
    CreateUserAddressRequest,
    'country_code' | 'state_code' | 'state_text'
  >> = {};

  if (!options.omitCountry && state.country_code) {
    location.country_code = state.country_code;
  }

  if (!options.omitSubdivision) {
    if (state.state_code) {
      location.state_code = state.state_code;
    }
    else if (state.state_text?.trim()) {
      location.state_text = state.state_text.trim();
    }
  }

  return {
    ...request,
    ...location,
  } as CreateUserAddressRequest;
}

/**
 * Guest checkout sends the canonical codes the form selected; the server
 * derives display names from them.
 */
export function toGuestAddress(state: AddressFormState): GuestCheckoutAddress {
  return {
    full_name: state.full_name ?? '',
    address_1: state.address_1 ?? '',
    address_2: state.address_2,
    city: state.city ?? '',
    country_code: state.country_code ?? '',
    state_code: state.state_code || undefined,
    state_text: state.state_text?.trim() || undefined,
    zip: state.zip ?? '',
    phone: state.phone ?? '',
  };
}
