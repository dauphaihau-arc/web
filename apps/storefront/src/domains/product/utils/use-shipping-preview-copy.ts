import { ShippingPreviewUnavailableReasons } from '@arc/enums';
import { formatMinorCurrency } from '@arc/utils';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

type ShippingPreview = NonNullable<
  NonNullable<GetDetailProductBySlugResponse['shipping']>['preview']
>;

export function useShippingPreviewCopy(
  preview: MaybeRefOrGetter<ShippingPreview | undefined>,
  destinationCountryLabel?: MaybeRefOrGetter<string | undefined>,
) {
  const { t } = useI18n();

  const detail = computed(() => {
    const value = toValue(preview);

    if (!value) {
      return '';
    }

    if (value.is_digital) {
      return t('catalog.shipping.digitalDelivery');
    }

    if (!value.available) {
      switch (value.reason) {
        case ShippingPreviewUnavailableReasons.UNSUPPORTED_DESTINATION: {
          const country = toValue(destinationCountryLabel);

          return country
            ? t('catalog.shipping.reason.unsupportedDestinationCountry', { country })
            : t('catalog.shipping.reason.unsupportedDestination');
        }
        case ShippingPreviewUnavailableReasons.PROFILE_NOT_READY:
        case ShippingPreviewUnavailableReasons.PROFILE_NOT_FOUND:
        case ShippingPreviewUnavailableReasons.MISSING_ASSIGNMENT:
          return t('catalog.shipping.reason.notConfigured');
        case ShippingPreviewUnavailableReasons.UNSUPPORTED_CURRENCY:
          return t('catalog.shipping.reason.unsupportedCurrency');
        default:
          return t('catalog.shipping.reason.unknown');
      }
    }

    const parts: string[] = [];

    if (value.one_item_fee_minor !== undefined && value.currency) {
      parts.push(t('catalog.shipping.fromFee', {
        fee: formatMinorCurrency(value.one_item_fee_minor, value.currency),
      }));
    }

    if (value.estimate) {
      parts.push(t('catalog.shipping.estimateDays', {
        min: value.estimate.min_days,
        max: value.estimate.max_days,
      }));
    }

    return parts.join(' · ');
  });

  const warning = computed(() => {
    const value = toValue(preview);

    if (!value || value.is_digital || value.available) {
      return '';
    }

    if (value.reason === ShippingPreviewUnavailableReasons.UNSUPPORTED_DESTINATION) {
      return t('catalog.shipping.previewWarning', { reason: detail.value });
    }

    return detail.value;
  });

  return { detail, warning };
}
