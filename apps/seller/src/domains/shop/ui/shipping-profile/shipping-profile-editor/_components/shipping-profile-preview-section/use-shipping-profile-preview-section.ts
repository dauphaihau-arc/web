import { ShippingProfileReadinessLabels } from '@arc/enums/shipping';
import { shopShippingProfileApi } from '~/domains/shop/api/shipping-profile/shipping-profile.api';
import type { ShippingRatePreviewResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id';
import { readShippingProfileApiError } from '../../../shipping-profile-api-error';

type ShippingProfilePreviewSectionProps = {
  profileId: string
};

export function useShippingProfilePreviewSection(props: ShippingProfilePreviewSectionProps) {
  const queryClient = useQueryClient();

  const previewState = reactive({
    country_code: '',
    quantity: 1,
  });
  const previewResult = ref<ShippingRatePreviewResource>();
  const previewError = ref('');
  const isPreviewing = ref(false);

  const canPreview = computed(() => Boolean(previewState.country_code) && previewState.quantity >= 1);

  const readinessIssueLabels = computed(() => (previewResult.value?.readiness_issues ?? [])
    .map(issue => ShippingProfileReadinessLabels[issue])
    .join(' · '));

  function formatCalendarDay(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }

  async function runPreview() {
    if (!props.profileId || !canPreview.value) return;

    previewError.value = '';
    previewResult.value = undefined;
    isPreviewing.value = true;
    try {
      const shopId = await resolveMyShopId(queryClient);
      previewResult.value = await shopShippingProfileApi.preview(shopId, props.profileId, {
        country_code: previewState.country_code,
        quantity: previewState.quantity,
      });
    }
    catch (error) {
      previewError.value = readShippingProfileApiError(error).message ?? 'Unable to preview this destination.';
    }
    finally {
      isPreviewing.value = false;
    }
  }

  return {
    canPreview,
    formatCalendarDay,
    isPreviewing,
    previewError,
    previewResult,
    previewState,
    readinessIssueLabels,
    runPreview,
  };
}
