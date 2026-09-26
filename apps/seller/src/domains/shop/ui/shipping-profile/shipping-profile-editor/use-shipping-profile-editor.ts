import type { FormErrorEvent } from '#ui/types';
import { ShippingProfileReadinessLabels, ShippingProfileStatuses } from '@arc/enums/shipping';
import { toastCustom } from '~/shared/config/toast';
import { shippingProfileFormSchema } from '../shipping-profile-form.schema';
import {
  collectProcessingTimeRangeIssue,
  collectShippingProfileFormReadinessIssues,
} from '../shipping-profile-form-readiness';
import { readShippingProfileApiError } from '../shipping-profile-api-error';
import { shopShippingProfileApi } from '~/domains/shop/api/shipping-profile/shipping-profile.api';
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id';
import { useCreateShippingProfile, useUpdateShippingProfile } from '~/domains/shop/mutations/shipping-profile.mutation';
import { useGetCountries } from '~/domains/location/queries/countries.query';
import {
  toShippingProfileFormState,
  toShippingProfileRateInputs,
} from './shipping-profile-editor.mapper';
import type { ShippingProfileEditorState } from './shipping-profile-editor.mapper';

type ShippingProfileEditorProps = {
  profile?: ShippingProfileResource
  shopCurrency?: string
};

type ShippingProfileEditorEmits = {
  (event: 'saved', profile: ShippingProfileResource): void
};

export function useShippingProfileEditor(
  props: ShippingProfileEditorProps,
  emit: ShippingProfileEditorEmits,
) {
  const modal = useModal();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: countriesResponse } = useGetCountries();
  const { mutateAsync: createProfile } = useCreateShippingProfile();
  const { mutateAsync: updateProfile } = useUpdateShippingProfile();

  const profileCurrency = computed(() => props.profile?.currency ?? props.shopCurrency ?? 'USD');

  const countryOptions = computed(() => (countriesResponse.value?.data ?? [])
    .filter(country => country.Iso2)
    .map(country => ({ label: country.name, value: country.Iso2! })));

  const state = reactive<ShippingProfileEditorState>(
    toShippingProfileFormState(props.profile, profileCurrency.value),
  );
  const isSubmitting = ref(false);
  /** Range mistakes are revealed on submit, matching the rest of the form. */
  const hasSubmitted = ref(false);
  const staleWriteError = ref('');
  const serverError = ref('');

  const activeWarning = computed(() => {
    const profile = props.profile;
    if (!profile || profile.status !== ShippingProfileStatuses.ACTIVE || profile.assigned_product_count <= 0) {
      return '';
    }
    const suffix = profile.assigned_product_count === 1 ? '' : 's';
    return `This active profile is assigned to ${profile.assigned_product_count} product${suffix}. Saving changes will affect future shipping quotes and delivery estimates for every assigned product.`;
  });

  const readinessIssues = computed(() => collectShippingProfileFormReadinessIssues(state));

  /**
   * Shown on the Processing field itself, so a draft sees the mistake without a
   * save round-trip: the activation checklist only covers active profiles, and
   * an unset range stays valid for a draft.
   */
  const processingRangeError = computed(() => {
    const issue = collectProcessingTimeRangeIssue(state);

    if (issue === null || issue === 'unset') {
      return undefined;
    }

    return issue === 'incomplete'
      ? ShippingProfileReadinessLabels.missing_processing_time
      : ShippingProfileReadinessLabels.invalid_processing_time;
  });

  async function submitProfile() {
    hasSubmitted.value = true;
    staleWriteError.value = '';
    serverError.value = '';

    if (processingRangeError.value) {
      return;
    }

    const parsed = shippingProfileFormSchema.safeParse(state);
    if (!parsed.success || readinessIssues.value.length > 0) {
      serverError.value = readinessIssues.value[0] ?? parsed.error?.issues[0]?.message ?? 'Review the highlighted fields.';
      return;
    }

    isSubmitting.value = true;
    try {
      const body = {
        name: parsed.data.name.trim(),
        status: parsed.data.status,
        ship_from_country: parsed.data.ship_from_country || undefined,
        ship_from_postal: parsed.data.ship_from_postal || undefined,
        processing_time_min_days: parsed.data.processing_time_min_days,
        processing_time_max_days: parsed.data.processing_time_max_days,
        rates: toShippingProfileRateInputs(parsed.data.rates, profileCurrency.value),
      };

      let saved;
      if (props.profile) {
        saved = await updateProfile({
          id: props.profile.id,
          body: {
            ...body,
            version: props.profile.version,
            ship_from_country: body.ship_from_country ?? null,
            ship_from_postal: body.ship_from_postal ?? null,
            processing_time_min_days: body.processing_time_min_days ?? null,
            processing_time_max_days: body.processing_time_max_days ?? null,
          },
        });
      }
      else {
        saved = await createProfile(body);
      }

      toast.add({
        ...toastCustom.success,
        title: props.profile ? 'Shipping profile updated' : 'Shipping profile created',
      });
      emit('saved', saved);
      await modal.close();
    }
    catch (error) {
      const apiError = readShippingProfileApiError(error);
      if (apiError.code === 'ShippingProfileVersionConflictError' && props.profile) {
        const shopId = await resolveMyShopId(queryClient);
        const latest = await shopShippingProfileApi.detail(shopId, props.profile.id);
        Object.assign(state, toShippingProfileFormState(latest, profileCurrency.value));
        staleWriteError.value = apiError.message ?? 'This profile changed while you were editing it. The latest saved values are loaded; review and reapply your changes.';
        return;
      }
      serverError.value = apiError.message ?? 'Unable to save the shipping profile.';
    }
    finally {
      isSubmitting.value = false;
    }
  }

  /**
   * Submit-time schema failures are already rendered inline by the owning
   * `UFormGroup`; mirror the product forms by revealing the first one instead
   * of reporting it as a save failure.
   */
  function onValidationError(event: FormErrorEvent) {
    hasSubmitted.value = true;

    const element = document.getElementById(event.errors[0]?.id);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return {
    activeWarning,
    countryOptions,
    hasSubmitted,
    isSubmitting,
    onValidationError,
    processingRangeError,
    profileCurrency,
    readinessIssues,
    serverError,
    staleWriteError,
    state,
    submitProfile,
  };
}
