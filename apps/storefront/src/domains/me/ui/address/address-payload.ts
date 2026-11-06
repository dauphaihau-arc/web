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
 */
export function hydrateAddressCodes(
  state: AddressFormState,
  countries: Country[] | undefined,
  areas: AdministrativeArea[] | undefined,
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

  const area = findAdministrativeArea(areas, state.state_code ?? state.state);

  if (area) {
    state.state_code = area.code;
    state.state = area.name;
  }
}

/**
 * Builds the saved-address payload: coded writes send the canonical codes and a
 * subdivision code or free text, while unresolved legacy rows fall back to the
 * display names the endpoint still accepts during the expand.
 */
export function toSavedAddressRequest(state: AddressFormState): CreateUserAddressRequest {
  const request: AddressFormState = { ...state };
  delete request.email;
  delete request.country;
  delete request.country_code;
  delete request.state;
  delete request.state_code;
  delete request.state_text;

  const location: Pick<
    CreateUserAddressRequest,
    'country' | 'country_code' | 'state' | 'state_code' | 'state_text'
  > = state.country_code
    ? { country_code: state.country_code }
    : { country: state.country ?? '' };

  if (state.state_code) {
    location.state_code = state.state_code;
  }
  else if (state.state_text?.trim()) {
    location.state_text = state.state_text;
  }
  else {
    location.state = state.state ?? '';
  }

  return {
    ...request,
    ...location,
  } as CreateUserAddressRequest;
}

/**
 * Guest checkout keeps its existing name-based shipping-address contract, so
 * code-only fields never leave the storefront for a guest order.
 */
export function toGuestAddress(state: AddressFormState): GuestCheckoutAddress {
  return {
    full_name: state.full_name ?? '',
    address_1: state.address_1 ?? '',
    address_2: state.address_2,
    city: state.city ?? '',
    country: state.country ?? '',
    state: state.state ?? '',
    zip: state.zip ?? '',
    phone: state.phone ?? '',
  };
}
