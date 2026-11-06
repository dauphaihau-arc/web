import { ADDRESS_CONFIG } from '@arc/enums/address';
import type { GetCountryAddressRulesResponse } from '~/domains/location/api/contracts/location.contract';

export type AddressFieldKey = 'email' | 'full_name' | 'address_1' | 'address_2' | 'city' | 'subdivision' | 'zip' | 'phone';
export type AddressFieldControl = 'text' | 'email' | 'select' | 'tel';

export interface AddressFieldRule {
  key: AddressFieldKey
  label: string
  visible: boolean
  required: boolean
  control: AddressFieldControl
  autocomplete: string
  maxLength: number
}

const MAX_LENGTH: Record<Exclude<AddressFieldKey, 'email'>, number> = {
  full_name: ADDRESS_CONFIG.MAX_CHAR_FULL_NAME,
  address_1: ADDRESS_CONFIG.MAX_CHAR_ADDRESS,
  address_2: ADDRESS_CONFIG.MAX_CHAR_ADDRESS,
  city: ADDRESS_CONFIG.MAX_CHAR_CITY,
  subdivision: ADDRESS_CONFIG.MAX_CHAR_CITY,
  zip: ADDRESS_CONFIG.MAX_CHAR_ZIP,
  phone: ADDRESS_CONFIG.MAX_CHAR_PHONE,
};

const FALLBACK: Omit<AddressFieldRule, 'maxLength'>[] = [
  {
    key: 'full_name', label: 'Full Name', visible: true, required: true, control: 'text', autocomplete: 'name',
  },
  {
    key: 'address_1', label: 'Street', visible: true, required: true, control: 'text', autocomplete: 'address-line1',
  },
  {
    key: 'address_2', label: 'Apt / Suite / Other', visible: true, required: false, control: 'text', autocomplete: 'address-line2',
  },
  {
    key: 'city', label: 'City', visible: true, required: true, control: 'text', autocomplete: 'address-level2',
  },
  {
    key: 'subdivision', label: 'State/Province', visible: true, required: false, control: 'text', autocomplete: 'address-level1',
  },
  {
    key: 'zip', label: 'Zip/Postal code', visible: true, required: false, control: 'text', autocomplete: 'postal-code',
  },
  {
    key: 'phone', label: 'Phone', visible: true, required: true, control: 'tel', autocomplete: 'tel',
  },
];

const EMAIL: AddressFieldRule = {
  key: 'email',
  label: 'Email',
  visible: true,
  required: true,
  control: 'email',
  autocomplete: 'email',
  maxLength: 320,
};

export function toAddressFieldRules(
  response: GetCountryAddressRulesResponse | undefined,
  options: { guest?: boolean } = {},
): AddressFieldRule[] {
  if (!response) return fallbackAddressFieldRules(options);

  const fields = response.fields.map(field => ({
    ...field,
    key: field.key as AddressFieldKey,
    control: field.control as AddressFieldControl,
    maxLength: MAX_LENGTH[field.key as Exclude<AddressFieldKey, 'email'>],
  }));

  if (options.guest) fields.push(EMAIL);
  return fields;
}

export function fallbackAddressFieldRules({ guest = false }: { guest?: boolean } = {}): AddressFieldRule[] {
  const fields = FALLBACK.map(rule => ({ ...rule, maxLength: MAX_LENGTH[rule.key as Exclude<AddressFieldKey, 'email'>] }));
  if (guest) fields.push(EMAIL);
  return fields;
}
