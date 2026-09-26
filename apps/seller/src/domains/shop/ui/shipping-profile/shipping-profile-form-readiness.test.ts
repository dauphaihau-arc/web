import {
  describe, expect, it,
} from 'vitest';
import {
  ShippingDestinationScopes,
  ShippingProfileReadinessLabels,
  ShippingProfileStatuses,
} from '@arc/enums/shipping';
import {
  collectProcessingTimeRangeIssue,
  collectShippingProfileFormReadinessIssues,
} from './shipping-profile-form-readiness';
import type { ShippingProfileFormState } from './shipping-profile-form.schema';

function activeForm(
  overrides: Partial<ShippingProfileFormState> = {},
): ShippingProfileFormState {
  return {
    name: 'Standard shipping',
    status: ShippingProfileStatuses.ACTIVE,
    processing_time_min_days: 1,
    processing_time_max_days: 3,
    rates: [{
      destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
      one_item_fee: 0,
      additional_item_fee: 0,
      delivery_time_min_days: 2,
      delivery_time_max_days: 5,
    }],
    ...overrides,
  };
}

describe('collectShippingProfileFormReadinessIssues', () => {
  it('flags a wholly absent Processing range instead of assuming zero days', () => {
    const form = activeForm({
      processing_time_min_days: undefined,
      processing_time_max_days: undefined,
    });

    expect(collectShippingProfileFormReadinessIssues(form))
      .toContain(ShippingProfileReadinessLabels.missing_processing_time);
  });

  it('flags every rate whose Delivery pair is wholly absent', () => {
    const form = activeForm({
      rates: [
        {
          destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
          one_item_fee: 0,
          additional_item_fee: 0,
        },
      ],
    });

    expect(collectShippingProfileFormReadinessIssues(form))
      .toContain(ShippingProfileReadinessLabels.missing_delivery_time);
  });

  it('flags a half-configured Delivery pair as missing rather than valid', () => {
    const form = activeForm({
      rates: [
        {
          destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
          one_item_fee: 0,
          additional_item_fee: 0,
          delivery_time_max_days: 5,
        },
      ],
    });

    expect(collectShippingProfileFormReadinessIssues(form))
      .toContain(ShippingProfileReadinessLabels.missing_delivery_time);
  });

  it('accepts large valid ranges without an undocumented ceiling', () => {
    const form = activeForm({
      processing_time_min_days: 30,
      processing_time_max_days: 400,
      rates: [
        {
          destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
          one_item_fee: 0,
          additional_item_fee: 0,
          delivery_time_min_days: 200,
          delivery_time_max_days: 900,
        },
      ],
    });

    expect(collectShippingProfileFormReadinessIssues(form)).toEqual([]);
  });

  it('reports inverted ranges as invalid', () => {
    const form = activeForm({
      processing_time_min_days: 9,
      processing_time_max_days: 2,
      rates: [
        {
          destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
          one_item_fee: 0,
          additional_item_fee: 0,
          delivery_time_min_days: 8,
          delivery_time_max_days: 1,
        },
      ],
    });

    const issues = collectShippingProfileFormReadinessIssues(form);

    expect(issues).toContain(ShippingProfileReadinessLabels.invalid_processing_time);
    expect(issues).toContain(ShippingProfileReadinessLabels.invalid_delivery_time);
  });

  it('does not require readiness for a draft profile', () => {
    const form = activeForm({
      status: ShippingProfileStatuses.DRAFT,
      processing_time_min_days: undefined,
      processing_time_max_days: undefined,
      rates: [],
    });

    expect(collectShippingProfileFormReadinessIssues(form)).toEqual([]);
  });
});

describe('collectProcessingTimeRangeIssue', () => {
  it('treats a wholly absent range as unset, so a draft can save without one', () => {
    const form = activeForm({
      processing_time_min_days: undefined,
      processing_time_max_days: undefined,
    });

    expect(collectProcessingTimeRangeIssue(form)).toBe('unset');
  });

  it('reports a half-configured pair as incomplete', () => {
    const form = activeForm({ processing_time_min_days: undefined, processing_time_max_days: 3 });

    expect(collectProcessingTimeRangeIssue(form)).toBe('incomplete');
  });

  it('reports an inverted pair as invalid', () => {
    const form = activeForm({ processing_time_min_days: 9, processing_time_max_days: 2 });

    expect(collectProcessingTimeRangeIssue(form)).toBe('invalid');
  });

  it('accepts a valid range, including one above any assumed ceiling', () => {
    const form = activeForm({ processing_time_min_days: 30, processing_time_max_days: 400 });

    expect(collectProcessingTimeRangeIssue(form)).toBeNull();
  });
});
