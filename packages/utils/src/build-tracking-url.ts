export function buildTrackingUrl(
  carrier?: string,
  trackingNumber?: string,
): string | undefined {
  const normalizedTrackingNumber = trackingNumber?.trim()

  if (!normalizedTrackingNumber) {
    return undefined
  }

  const normalizedCarrier = carrier?.trim().toLowerCase()
  const encodedTracking = encodeURIComponent(normalizedTrackingNumber)

  if (!normalizedCarrier) {
    return `https://www.google.com/search?q=${encodedTracking}`
  }

  if (normalizedCarrier.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${encodedTracking}`
  }

  if (normalizedCarrier.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodedTracking}`
  }

  if (normalizedCarrier.includes('usps') || normalizedCarrier.includes('postal')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedTracking}`
  }

  if (normalizedCarrier.includes('dhl')) {
    return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodedTracking}`
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${normalizedTrackingNumber}`)}`
}
