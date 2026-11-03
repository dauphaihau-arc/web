import { describe, expect, it } from 'vitest'
import { carrierEventLabel } from './carrier-event-label'

describe('carrierEventLabel', () => {
  it('words every carrier scan code the apps display', () => {
    expect(carrierEventLabel('LABEL_CREATED')).toBe('Label created')
    expect(carrierEventLabel('PICKED_UP')).toBe('Picked up')
    expect(carrierEventLabel('IN_TRANSIT')).toBe('In transit')
    expect(carrierEventLabel('OUT_FOR_DELIVERY')).toBe('Out for delivery')
    expect(carrierEventLabel('DELIVERED')).toBe('Delivered')
    expect(carrierEventLabel('DELIVERY_FAILED')).toBe('Delivery failed')
    expect(carrierEventLabel('RETURNED')).toBe('Returned to sender')
  })

  it('accepts lower-case and padded codes from carrier payloads', () => {
    expect(carrierEventLabel(' in_transit ')).toBe('In transit')
  })

  it('leaves unknown or absent codes for the caller to word', () => {
    expect(carrierEventLabel('EXCEPTION')).toBeUndefined()
    expect(carrierEventLabel('')).toBeUndefined()
    expect(carrierEventLabel(undefined)).toBeUndefined()
    expect(carrierEventLabel(null)).toBeUndefined()
  })
})
