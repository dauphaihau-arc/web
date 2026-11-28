import { formatMinorCurrency } from '@arc/utils';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';
import { resolveShippingUnavailableKind } from '~/shared/utils/shipping-unavailable';

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
      switch (resolveShippingUnavailableKind(value.reason)) {
        case 'destination': {
          const country = toValue(destinationCountryLabel);

          return country
            ? t('catalog.shipping.reason.unsupportedDestinationCountry', { country })
            : t('catalog.shipping.reason.unsupportedDestination');
        }
        case 'currency':
          return t('catalog.shipping.reason.unsupportedCurrency');
        case 'unavailable':
          return t('catalog.shipping.reason.unavailable');
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

    if (resolveShippingUnavailableKind(value.reason) === 'destination') {
      return t('catalog.shipping.previewWarning', { reason: detail.value });
    }

    return detail.value;
  });

  return { detail, warning };
}
