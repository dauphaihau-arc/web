import type { FormSubmitEvent } from '#ui/types';
import {
  computed,
  reactive,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import type {
  GetUserAddressesResponse,
  UpdateUserAddressRequest,
} from '~/domains/me/api/address/contracts/address.contract';
import { useUpdateUserAddress } from '~/domains/me/mutations/address/update-address.mutation';
import { useGetAddressRules, useGetAdministrativeAreas, useGetCountries } from '~/domains/location/queries/countries.query';
import { findCountry, findCountryCode } from '~/domains/location/utils/find-country-code';
import { hydrateAddressCodes, toSavedAddressRequest } from '~/domains/me/ui/address/address-payload';
import { createCodedAddressFormSchema } from '~/domains/me/ui/address/address-form.schema';
import { fallbackAddressFieldRules, toAddressFieldRules } from '~/domains/me/ui/address/address-field-rules';
import type { AddressFormState } from '~/domains/me/ui/address/address-form.types';
import { toastCustom } from '~/shared/config/toast';

export type UserAddress = GetUserAddressesResponse['results'][number];

/** Template surface the footer submit button needs from `UForm`. */
interface AddressFormRef {
  clear: () => void
  submit: () => void
}

/**
 * Owns the edit-address form: state seeded from the saved row, location
 * reference data, the resolution of legacy text/codes, the validation schema,
 * and the update request with its cache invalidation.
 */
export function useUpdateUserAddressForm(dataEdit: UserAddress) {
  const toast = useToast();
  const dialog = useModal();
  const queryClient = useQueryClient();

  const formRef = useTemplateRef<AddressFormRef>('formRef');

  const stateSubmit = reactive<AddressFormState>({
    full_name: dataEdit.full_name,
    address_1: dataEdit.address_1,
    address_2: dataEdit.address_2,
    city: dataEdit.city,
    country: dataEdit.country,
    country_code: dataEdit.country_code ?? undefined,
    state: dataEdit.state,
    state_code: dataEdit.state_code ?? undefined,
    state_text: dataEdit.state_code ? undefined : dataEdit.state,
    zip: dataEdit.zip,
    phone: dataEdit.phone,
    is_primary: dataEdit.is_primary,
  });

  /**
   * A row without a subdivision code keeps its legacy label until the buyer
   * explicitly chooses a value from the list, so the original text must never
   * be rewritten by unrelated edits.
   */
  const legacySubdivisionLabel = ref(
    dataEdit.state_code ? undefined : dataEdit.state?.trim() || undefined,
  );

  const isChoosingSubdivision = ref(false);
  const countryTouched = ref(false);
  const subdivisionTouched = ref(false);

  const {
    data: dataGetCountries,
    isPending: isPendingGetCountries,
  } = useGetCountries();

  /**
   * Older rows have no codes, so the country and subdivision are resolved from
   * the Arc reference data by display name (or by a stored code) for display.
   */
  const selectedCountryCode = computed(() =>
    findCountryCode(dataGetCountries.value, stateSubmit.country_code ?? stateSubmit.country));

  const selectedCountry = computed(() =>
    findCountry(dataGetCountries.value, selectedCountryCode.value));

  const hasAdministrativeAreas = computed(() =>
    selectedCountry.value?.has_administrative_areas ?? false);

  const postalCodeRequired = computed(() =>
    selectedCountry.value?.postal_code_required ?? false);

  const {
    data: dataGetAdministrativeAreas,
    isFetching: isPendingGetStates,
  } = useGetAdministrativeAreas(selectedCountryCode);

  const isInactiveCountry = computed(() =>
    !!stateSubmit.country_code
    && !!dataGetCountries.value
    && !findCountry(dataGetCountries.value, stateSubmit.country_code),
  );

  const isLegacySubdivision = computed(() =>
    hasAdministrativeAreas.value
    && !stateSubmit.state_code
    && !!legacySubdivisionLabel.value
    && !isChoosingSubdivision.value,
  );

  /**
   * Inactive country codes are no longer offered by the picker, but a stored
   * one stays readable (and unchanged on save) instead of blanking the
   * subdivision.
   */
  const readOnlySubdivisionLabel = computed(() => {
    if (isLegacySubdivision.value) {
      return legacySubdivisionLabel.value;
    }

    if (isInactiveCountry.value && stateSubmit.state_code) {
      return stateSubmit.state || stateSubmit.state_code;
    }

    return undefined;
  });

  const { data: dataGetAddressRules } = useGetAddressRules(selectedCountryCode);

  const fieldRules = computed(() => dataGetAddressRules.value
    ? toAddressFieldRules(dataGetAddressRules.value)
    : fallbackAddressFieldRules({ guest: false }));

  const schema = computed(() => createCodedAddressFormSchema(hasAdministrativeAreas.value, {
    allowLegacyCountry: !stateSubmit.country_code && !!stateSubmit.country?.trim(),
    allowLegacySubdivision: isLegacySubdivision.value,
    countryCode: selectedCountryCode.value,
    postalCodeRequired: postalCodeRequired.value,
    subdivisionVisible: fieldRules.value.find(rule => rule.key === 'subdivision')?.visible ?? true,
    postcodeVisible: fieldRules.value.find(rule => rule.key === 'zip')?.visible ?? true,
    // Rows saved before the international rules keep their original
    // phone/postcode untouched; an unrelated edit must still save. Choosing a
    // new country re-enables validation because those rules are country-scoped.
    preservePhone: countryTouched.value ? undefined : dataEdit.phone,
    preserveZip: countryTouched.value ? undefined : dataEdit.zip,
  }));

  const subdivisionFieldName = computed(() =>
    hasAdministrativeAreas.value ? 'state_code' : 'state_text');

  watch(
    [dataGetCountries, dataGetAdministrativeAreas, hasAdministrativeAreas],
    () => {
      hydrateAddressCodes(
        stateSubmit,
        dataGetCountries.value,
        dataGetAdministrativeAreas.value,
        { preserveLegacySubdivision: true },
      );
    },
    { immediate: true },
  );

  function onCountryChange(countryCode: string | undefined) {
    countryTouched.value = true;
    legacySubdivisionLabel.value = undefined;
    isChoosingSubdivision.value = false;
    subdivisionTouched.value = false;
    stateSubmit.country_code = countryCode;
    stateSubmit.country = findCountry(dataGetCountries.value, countryCode)?.name;
    stateSubmit.state_code = undefined;
    stateSubmit.state_text = undefined;
    stateSubmit.state = undefined;
    stateSubmit.city = undefined;
    stateSubmit.zip = undefined;
    stateSubmit.phone = undefined;
  }

  function onStateCodeChange(stateCode: string | undefined) {
    subdivisionTouched.value = true;
    stateSubmit.state_code = stateCode;
    stateSubmit.state_text = undefined;
    stateSubmit.state = dataGetAdministrativeAreas.value
      ?.find(area => area.code === stateCode)?.name;
  }

  function onStateTextChange(stateText: string | undefined) {
    subdivisionTouched.value = true;
    stateSubmit.state_text = stateText;
    stateSubmit.state = stateText;
  }

  function startChoosingSubdivision() {
    isChoosingSubdivision.value = true;
  }

  const {
    mutateAsync: updateUserAddress,
    isPending: isPendingUpdateAddress,
  } = useUpdateUserAddress();

  async function onSubmit(event: FormSubmitEvent<AddressFormState>) {
    formRef.value?.clear();
    try {
      const payload: UpdateUserAddressRequest = {
        ...toSavedAddressRequest(event.data, {
          // Untouched location fields are omitted so the server preserves legacy
          // text and inactive codes exactly as stored.
          omitCountry: !countryTouched.value && !subdivisionTouched.value,
          omitSubdivision: !subdivisionTouched.value,
        }),
        id: dataEdit.id,
      };

      await updateUserAddress(payload);

      await queryClient.invalidateQueries({
        queryKey: ['get-user-addresses'],
      });

      await dialog.close();
    }
    catch {
      toast.add({
        ...toastCustom.error,
        title: 'Update address failed',
      });
    }
  }

  return {
    formRef,
    stateSubmit,
    schema,
    dataGetCountries,
    isPendingGetCountries,
    dataGetAdministrativeAreas,
    isPendingGetStates,
    selectedCountryCode,
    hasAdministrativeAreas,
    postalCodeRequired,
    fieldRules,
    subdivisionFieldName,
    isLegacySubdivision,
    readOnlySubdivisionLabel,
    onCountryChange,
    onStateCodeChange,
    onStateTextChange,
    startChoosingSubdivision,
    isPendingUpdateAddress,
    onSubmit,
    dialog,
  };
}
