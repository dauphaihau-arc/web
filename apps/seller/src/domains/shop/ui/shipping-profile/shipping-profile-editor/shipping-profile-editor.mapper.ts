import { ShippingDestinationScopes, ShippingProfileStatuses } from '@arc/enums/shipping';
import { fromMinorUnits, toMinorUnits } from '@arc/utils';
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';
import type { ShippingProfileFormRate, ShippingProfileFormState } from '../shipping-profile-form.schema';

/** A rate row as it exists inside the editor: identity is always present. */
export type ShippingProfileRateDraft = ShippingProfileFormRate & { localId: string };

export type ShippingProfileEditorState = Omit<ShippingProfileFormState, 'rates'> & {
  rates: ShippingProfileRateDraft[]
};

export function createEmptyShippingProfileRate(): ShippingProfileRateDraft {
  return {
    localId: crypto.randomUUID(),
    destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
    one_item_fee: 0,
    additional_item_fee: 0,
  };
}

/** API resource -> editable form state. `currency` is required to read minor units. */
export function toShippingProfileFormState(
  profile: ShippingProfileResource | undefined,
  currency: string,
): ShippingProfileEditorState {
  if (!profile) {
    return {
      name: '',
      status: ShippingProfileStatuses.DRAFT,
      rates: [createEmptyShippingProfileRate()],
    };
  }

  return {
    name: profile.name,
    // Archived profiles are terminal and are never opened in this editor.
    status: profile.status === ShippingProfileStatuses.ARCHIVED
      ? ShippingProfileStatuses.DRAFT
      : profile.status,
    // Absent ranges stay absent: a prefilled zero would contradict the minimum
    // the seller is still typing.
    processing_time_min_days: profile.processing_time_min_days ?? undefined,
    processing_time_max_days: profile.processing_time_max_days ?? undefined,
    // Nullable API fields become absent form fields so optional schema rules
    // never see a null.
    ship_from_country: profile.ship_from_country ?? undefined,
    ship_from_postal: profile.ship_from_postal ?? undefined,
    rates: profile.rates.map(rate => ({
      localId: rate.id,
      destination_scope: rate.destination_scope,
      destination_country: rate.destination_country ?? undefined,
      one_item_fee: fromMinorUnits(rate.one_item_fee_minor, currency),
      additional_item_fee: fromMinorUnits(rate.additional_item_fee_minor, currency),
      delivery_time_min_days: rate.delivery_time_min_days ?? undefined,
      delivery_time_max_days: rate.delivery_time_max_days ?? undefined,
    })),
  };
}

/** Form rates -> API rate inputs, dropping fields the chosen scope does not use. */
export function toShippingProfileRateInputs(
  rates: ShippingProfileFormRate[],
  currency: string,
) {
  return rates.map(rate => ({
    destination_scope: rate.destination_scope,
    destination_country: rate.destination_scope === ShippingDestinationScopes.EVERYWHERE_ELSE
      ? undefined
      : rate.destination_country,
    one_item_fee_minor: toMinorUnits(rate.one_item_fee, currency),
    additional_item_fee_minor: toMinorUnits(rate.additional_item_fee, currency),
    delivery_time_min_days: rate.delivery_time_min_days,
    delivery_time_max_days: rate.delivery_time_max_days,
  }));
}
