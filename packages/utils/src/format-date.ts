const SHORT_DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

type DateParts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>

function toDateParts(date: Date): DateParts {
  return Object.fromEntries(
    SHORT_DATE_TIME_FORMAT.formatToParts(date).map(({ type, value }) => [type, value]),
  )
}

/**
 * Formats an API date-time string (ISO 8601) for display, e.g. `Nov 5, 3:07pm`.
 *
 * Contract values are wire strings; this is the single place that turns one
 * into an instant. The date itself is interpreted in the browser's timezone,
 * matching the previous `dayjs(...).format('MMM D, h:mma')` output.
 */
export function formatShortDateTime(value?: string | Date | null): string {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = toDateParts(date)
  const dayPeriod = (parts.dayPeriod ?? '').toLowerCase()

  return `${parts.month} ${parts.day}, ${parts.hour}:${parts.minute}${dayPeriod}`
}
