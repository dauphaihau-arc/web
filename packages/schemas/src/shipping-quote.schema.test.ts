import { describe, expect, it } from 'vitest'
import {
  acceptedShippingFieldsSchema,
  checkoutShippingQuoteSchema,
} from './shipping-quote.schema'

const SHOP_ID = '00000000-0000-4000-8000-000000000001'
const PRODUCT_ID = '00000000-0000-4000-8000-000000000002'
const INVENTORY_ID = '00000000-0000-4000-8000-000000000003'
const PROFILE_ID = '00000000-0000-4000-8000-000000000004'
const RATE_ID = '00000000-0000-4000-8000-000000000005'
const COUPON_ID = '00000000-0000-4000-8000-000000000006'

/** The frozen snake_case snapshot the API returns per shop for quotes/orders. */
function buildQuote() {
  return {
    shop_id: SHOP_ID,
    currency: 'USD',
    charge: {
      currency: 'USD',
      quantity: 3,
      base_unit: {
        product_id: PRODUCT_ID,
        inventory_id: INVENTORY_ID,
        one_item_fee_minor: 599,
      },
      base_item_fee_minor: 599,
      base_item_total_minor: 599,
      additional_items_quantity: 2,
      additional_components: [
        {
          product_id: PRODUCT_ID,
          inventory_id: INVENTORY_ID,
          quantity: 2,
          additional_item_fee_minor: 200,
        },
      ],
      additional_item_fee_minor_total: 400,
      total_minor: 999,
    },
    estimate: {
      processing_time_min_days: 1,
      processing_time_max_days: 3,
      delivery_time_min_days: 3,
      delivery_time_max_days: 5,
      combined_min_days: 4,
      combined_max_days: 8,
      anchor_at: '2026-09-22T00:00:00.000Z',
      earliest_delivery_date: '2026-09-26T00:00:00.000Z',
      latest_delivery_date: '2026-09-30T00:00:00.000Z',
    },
    units: [
      {
        product_id: PRODUCT_ID,
        inventory_id: INVENTORY_ID,
        quantity: 3,
        profile_id: PROFILE_ID,
        profile_version: 4,
        profile_shop_id: SHOP_ID,
        rate_id: RATE_ID,
        rate_destination_scope: 'country',
        rate_destination_country: 'US',
        currency: 'USD',
        one_item_fee_minor: 599,
        additional_item_fee_minor: 200,
        processing_time_min_days: 1,
        processing_time_max_days: 3,
        delivery_time_min_days: 3,
        delivery_time_max_days: 5,
      },
    ],
  }
}

describe('checkoutShippingQuoteSchema', () => {
  it('accepts the persisted charge, calculation inputs, and estimate snapshot', () => {
    const parsed = checkoutShippingQuoteSchema.parse(buildQuote())

    expect(parsed.charge.total_minor).toBe(999)
    expect(parsed.charge.base_unit.one_item_fee_minor).toBe(599)
    expect(parsed.charge.additional_components).toHaveLength(1)
    expect(parsed.units[0].profile_version).toBe(4)
    expect(parsed.estimate.combined_min_days).toBe(4)
    expect(parsed.estimate.combined_max_days).toBe(8)
    expect(parsed.estimate.earliest_delivery_date).toBe('2026-09-26T00:00:00.000Z')
  })

  it('rejects a charge that loses its matched rate identity', () => {
    const quote = buildQuote()
    quote.units[0].rate_id = 'not-a-uuid'

    expect(() => checkoutShippingQuoteSchema.parse(quote)).toThrow()
  })

  it('rejects a negative money component instead of accepting a malformed quote', () => {
    const quote = buildQuote()
    quote.charge.total_minor = -1

    expect(() => checkoutShippingQuoteSchema.parse(quote)).toThrow()
  })
})

describe('acceptedShippingFieldsSchema', () => {
  it('accepts a free-shipping waiver as provenance, never as merchandise discount', () => {
    const parsed = acceptedShippingFieldsSchema.parse({
      shipping: buildQuote(),
      shipping_discount_minor: 999,
      shipping_discounts: [
        {
          coupon_id: COUPON_ID,
          code: 'FREESHIP',
          type: 'free_ship',
          applies_to: 'all',
          applies_product_ids: [],
          min_order_type: 'order_total',
          min_order_value: 5000,
          min_products: 0,
          max_uses: 100,
          max_uses_per_user: 1,
          uses_count: 7,
          waived_minor: 999,
          currency: 'USD',
        },
      ],
    })

    expect(parsed.shipping?.charge.total_minor).toBe(999)
    expect(parsed.shipping_discounts?.[0].waived_minor).toBe(999)
  })

  it('accepts orders without an accepted shipping snapshot', () => {
    expect(acceptedShippingFieldsSchema.parse({})).toEqual({})
  })
})
