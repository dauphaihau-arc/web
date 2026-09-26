import {
  describe, expect, it,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';
import ShippingProfilesTable from './shipping-profiles-table.vue';

function profile(overrides: Partial<ShippingProfileResource>): ShippingProfileResource {
  return {
    id: 'profile-1',
    shop_id: 'shop-1',
    name: 'Standard',
    status: 'active',
    version: 1,
    currency: 'USD',
    checkout_ready: true,
    readiness_issues: [],
    is_default: false,
    assigned_product_count: 0,
    published_product_count: 0,
    rates: [],
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as ShippingProfileResource;
}

function render(profiles: ShippingProfileResource[]) {
  return mountSuspended(ShippingProfilesTable, {
    props: {
      profiles,
      loading: false,
      page: 1,
      pageCount: 20,
      total: profiles.length,
    },
  });
}

function rate(overrides: Partial<ShippingProfileResource['rates'][number]>) {
  return {
    id: 'rate-1',
    position: 1,
    destination_scope: 'country',
    destination_country: 'US',
    one_item_fee_minor: 599,
    additional_item_fee_minor: 199,
    delivery_time_min_days: 3,
    delivery_time_max_days: 5,
    ...overrides,
  } as ShippingProfileResource['rates'][number];
}

describe('shipping profiles table default designation', () => {
  it('offers the default action only on a profile that can price a checkout', async () => {
    const wrapper = await render([
      profile({ id: 'eligible', name: 'Eligible' }),
      profile({
        id: 'draft', name: 'Draft', status: 'draft', checkout_ready: false,
      }),
      profile({
        id: 'archived', name: 'Archived', status: 'archived', checkout_ready: false,
      }),
      profile({ id: 'not-ready', name: 'Not ready', checkout_ready: false }),
    ]);

    expect(wrapper.findAll('[aria-label="Set as default"]')).toHaveLength(1);
    expect(wrapper.findAll('[aria-label="Clear default"]')).toHaveLength(0);
  });

  it('marks the default profile and offers to clear it instead', async () => {
    const wrapper = await render([
      profile({ id: 'default-profile', name: 'Chosen', is_default: true }),
      profile({ id: 'other', name: 'Other' }),
    ]);

    expect(wrapper.text()).toContain('Default');
    expect(wrapper.findAll('[aria-label="Clear default"]')).toHaveLength(1);
    expect(wrapper.findAll('[aria-label="Set as default"]')).toHaveLength(1);
  });
});

describe('shipping profiles table coverage and rates', () => {
  const rates = [
    rate({
      id: 'rate-us',
      position: 1,
      destination_country: 'US',
      one_item_fee_minor: 599,
      additional_item_fee_minor: 199,
      delivery_time_min_days: 3,
      delivery_time_max_days: 5,
    }),
    rate({
      id: 'rate-ca',
      position: 2,
      destination_country: 'CA',
      one_item_fee_minor: 1299,
      additional_item_fee_minor: 399,
      delivery_time_min_days: 4,
      delivery_time_max_days: 8,
    }),
    rate({
      id: 'rate-everywhere',
      position: 3,
      destination_scope: 'everywhere_else',
      destination_country: undefined,
      one_item_fee_minor: 1999,
      additional_item_fee_minor: 599,
      delivery_time_min_days: 7,
      delivery_time_max_days: 14,
    }),
  ];

  it('summarizes coverage and the cheapest rate, keeping the rest behind the row disclosure', async () => {
    const wrapper = await render([profile({ name: 'Standard shipping', rates })]);

    const disclosure = wrapper.get('[aria-expanded]');

    expect(disclosure.text()).toContain('US · CA +1 more');
    expect(disclosure.text()).toContain('From $5.99 · 3–5 days in transit');
    expect(disclosure.text()).not.toContain('Everywhere else');
    expect(disclosure.text()).not.toContain('$19.99');

    await disclosure.trigger('click');

    expect(wrapper.text()).toContain('Everywhere else');
    expect(wrapper.text()).toContain('$19.99 first · $5.99 additional');
    expect(wrapper.text()).toContain('7–14 days in transit');
  });

  it('shows the exact fee split for a single-rate profile without a disclosure', async () => {
    const wrapper = await render([profile({ rates: [rates[0]] })]);

    expect(wrapper.find('[aria-expanded]').exists()).toBe(false);
    expect(wrapper.text()).toContain('US');
    expect(wrapper.text()).toContain('$5.99 first · $1.99 additional · 3–5 days in transit');
  });

  it('renders no disclosure for a profile that prices nothing', async () => {
    const wrapper = await render([profile({ rates: [] })]);

    expect(wrapper.find('[aria-expanded]').exists()).toBe(false);
  });
});
