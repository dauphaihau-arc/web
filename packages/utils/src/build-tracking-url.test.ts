import { describe, expect, it } from 'vitest'
import { buildTrackingUrl } from './build-tracking-url'

describe('buildTrackingUrl', () => {
  it('returns undefined without a tracking number', () => {
    expect(buildTrackingUrl('UPS', '   ')).toBeUndefined()
    expect(buildTrackingUrl('UPS')).toBeUndefined()
  })

  it('builds carrier-specific tracking URLs', () => {
    expect(buildTrackingUrl('UPS', '1Z 999')).toBe('https://www.ups.com/track?tracknum=1Z%20999')
    expect(buildTrackingUrl('FedEx', 'FX-100')).toBe('https://www.fedex.com/fedextrack/?trknbr=FX-100')
    expect(buildTrackingUrl('US Postal Service', '9400')).toBe('https://tools.usps.com/go/TrackConfirmAction?tLabels=9400')
    expect(buildTrackingUrl('DHL Express', 'JD 123')).toBe('https://www.dhl.com/us-en/home/tracking.html?tracking-id=JD%20123')
  })

  it('falls back to a search URL when the carrier is unknown', () => {
    expect(buildTrackingUrl('Local Carrier', 'ABC 123')).toBe('https://www.google.com/search?q=Local%20Carrier%20ABC%20123')
    expect(buildTrackingUrl(undefined, 'ABC 123')).toBe('https://www.google.com/search?q=ABC%20123')
  })
})
