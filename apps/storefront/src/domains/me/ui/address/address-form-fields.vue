<script setup lang="ts">
import type { AdministrativeArea, Country } from '~/domains/location/api/contracts/location.contract'
import { toCountryOptionLabel } from '~/domains/location/utils/country-flag'
import type { AddressFieldRule } from './address-field-rules'
import type { AddressFormState } from './address-form.types'
import LegacySubdivisionField from './legacy-subdivision-field.vue'
import PhoneInput from './phone-input.vue'

const props = withDefaults(defineProps<{
  fields?: AddressFieldRule[]
  guest?: boolean
  countries?: Country[]
  /** Resolved ISO code for the selected country; drives phone normalisation and area lookups. */
  countryCode?: string
  isPendingCountries?: boolean
  areas?: AdministrativeArea[]
  isFetchingAreas?: boolean
  hasAdministrativeAreas: boolean
  postalCodeRequired: boolean
  subdivisionFieldName: string
  /** Preserved subdivision label shown by the update dialog. */
  legacySubdivisionLabel?: string
  /** Read-only subdivision label shown for preserved/inactive rows. */
  readOnlySubdivisionLabel?: string
  isLegacySubdivision?: boolean
}>(), {
  guest: false,
  fields: () => [],
  countries: () => [],
  countryCode: undefined,
  areas: () => [],
  isPendingCountries: false,
  isFetchingAreas: false,
  isLegacySubdivision: false,
  legacySubdivisionLabel: undefined,
  readOnlySubdivisionLabel: undefined,
})

const state = defineModel<AddressFormState>('state', { required: true })

const emit = defineEmits<{
  countryChange: [countryCode: string | undefined]
  stateCodeChange: [stateCode: string | undefined]
  stateTextChange: [stateText: string | undefined]
  chooseSubdivision: []
}>()

const visibleRules = computed(() =>
  props.fields.filter(rule => rule.visible && rule.key !== 'email'))

const resolvedCountryCode = computed(() => props.countryCode ?? state.value.country_code)

const countryOptions = computed(() =>
  props.countries.map(country => ({
    ...country,
    name: toCountryOptionLabel(country.code, country.name),
  })))

const countryPlaceholder = computed(() =>
  state.value.country
    ? toCountryOptionLabel(resolvedCountryCode.value, state.value.country)
    : undefined)

const legacySubdivisionValue = computed(() =>
  props.readOnlySubdivisionLabel || props.legacySubdivisionLabel)

const usesLegacySubdivision = computed(() => Boolean(legacySubdivisionValue.value))

function fieldLabel(rule: AddressFieldRule) {
  return rule.key === 'zip' && !rule.required
    ? `${rule.label} (optional)`
    : rule.label
}

function fieldName(rule: AddressFieldRule) {
  return rule.key === 'subdivision' ? props.subdivisionFieldName : rule.key
}

function fieldRequired(rule: AddressFieldRule) {
  // A preserved legacy subdivision is intentionally not required until the
  // buyer replaces it; the schema defers through `allowLegacySubdivision`.
  return rule.key === 'subdivision' && props.isLegacySubdivision
    ? false
    : rule.required
}

function onCountryChange(value: unknown) {
  emit('countryChange', typeof value === 'string' ? value : undefined)
}

function onStateCodeChange(value: unknown) {
  emit('stateCodeChange', typeof value === 'string' ? value : undefined)
}

function onStateTextChange(value: string | number | undefined) {
  emit('stateTextChange', value === undefined ? undefined : String(value))
}
</script>

<template>
  <UFormGroup
    v-if="props.guest"
    required
    label="Email"
    name="email"
    class="mb-4"
  >
    <UInput
      v-model="state.email"
      name="email"
      size="lg"
      type="email"
      autocomplete="email"
      maxlength="320"
    />
  </UFormGroup>

  <UFormGroup
    required
    label="Country"
    :name="props.guest ? 'country' : 'country_code'"
    class="mb-4"
  >
    <USelectMenu
      v-model="state.country_code"
      searchable
      :disabled="props.isPendingCountries"
      :placeholder="countryPlaceholder"
      :options="countryOptions"
      value-attribute="code"
      option-attribute="name"
      size="lg"
      @update:model-value="onCountryChange"
    />
  </UFormGroup>

  <UFormGroup
    v-for="rule in visibleRules"
    :key="rule.key"
    :required="fieldRequired(rule)"
    :label="fieldLabel(rule)"
    :name="fieldName(rule)"
    class="mb-4"
  >
    <PhoneInput
      v-if="rule.key === 'phone'"
      v-model="state.phone"
      name="phone"
      :country-code="resolvedCountryCode"
      :maxlength="rule.maxLength"
      size="lg"
    />
    <template v-else-if="rule.key === 'subdivision'">
      <LegacySubdivisionField
        v-if="usesLegacySubdivision"
        :value="legacySubdivisionValue ?? ''"
        :action-label="props.isLegacySubdivision ? 'Choose from list' : undefined"
        @choose="emit('chooseSubdivision')"
      />
      <USelectMenu
        v-else-if="rule.control === 'select'"
        :model-value="state.state_code"
        searchable
        :loading="props.isFetchingAreas"
        :placeholder="state.state"
        :disabled="!resolvedCountryCode || props.isFetchingAreas"
        :options="props.areas"
        value-attribute="code"
        option-attribute="name"
        size="lg"
        trailing
        @update:model-value="onStateCodeChange"
      />
      <UInput
        v-else
        :model-value="state.state_text"
        name="state_text"
        :disabled="!resolvedCountryCode && !state.country"
        :maxlength="rule.maxLength"
        autocomplete="address-level1"
        size="lg"
        @update:model-value="onStateTextChange"
      />
    </template>
    <UInput
      v-else
      v-model="state[rule.key]"
      :name="rule.key"
      :maxlength="rule.maxLength"
      :autocomplete="rule.autocomplete"
      size="lg"
    />
  </UFormGroup>

  <UCheckbox
    v-if="!props.guest"
    v-model="state.is_primary"
    label="Set as default"
    name="is_primary"
  />
</template>
