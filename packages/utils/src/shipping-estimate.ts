const ESTIMATE_MONTH_DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export interface ShippingEstimateRange {
  earliest_delivery_date: string | Date
  latest_delivery_date: string | Date
}

/**
 * Formats the server-computed seller delivery estimate. The dates come from the
 * accepted quote snapshot; the browser only renders them, never derives them.
 *
 * Each part of the window is stated once so the estimate reads short: the
 * current year is omitted, a shared month is named once, and a window that
 * crosses a year boundary keeps both years.
 */
export function formatShippingEstimateRange(estimate?: ShippingEstimateRange): string {
  if (!estimate) {
    return ''
  }

  const earliest = estimate.earliest_delivery_date instanceof Date
    ? estimate.earliest_delivery_date
    : new Date(estimate.earliest_delivery_date)
  const latest = estimate.latest_delivery_date instanceof Date
    ? estimate.latest_delivery_date
    : new Date(estimate.latest_delivery_date)

  if (Number.isNaN(earliest.getTime()) || Number.isNaN(latest.getTime())) {
    return ''
  }

  const earliestParts = Object.fromEntries(
    ESTIMATE_MONTH_DAY_FORMAT.formatToParts(earliest).map(({ type, value }) => [type, value]),
  )
  const latestParts = Object.fromEntries(
    ESTIMATE_MONTH_DAY_FORMAT.formatToParts(latest).map(({ type, value }) => [type, value]),
  )

  const currentYear = new Date().getUTCFullYear()
  const earliestYear = earliest.getUTCFullYear()
  const latestYear = latest.getUTCFullYear()

  // A window that crosses a year boundary is only unambiguous with both years.
  if (earliestYear !== latestYear) {
    return `${earliestParts.month} ${earliestParts.day}, ${earliestYear} - ${latestParts.month} ${latestParts.day}, ${latestYear}`
  }

  const yearSuffix = earliestYear === currentYear ? '' : `, ${earliestYear}`
  const start = `${earliestParts.month} ${earliestParts.day}`

  if (earliestParts.month === latestParts.month) {
    return earliestParts.day === latestParts.day
      ? `${start}${yearSuffix}`
      : `${start} - ${latestParts.day}${yearSuffix}`
  }

  return `${start} - ${latestParts.month} ${latestParts.day}${yearSuffix}`
}
