interface ZonedScheduleParts {
  year: number
  month: string
  day: number
  time: string
}

/**
 * The wall-clock pieces of an instant in one timezone. `formatToParts` is used
 * rather than `Date` getters because the year, month and day that matter are
 * the ones the schedule was authored in, not the ones on the seller's machine.
 */
function zonedScheduleParts(instant: string | Date, timezone: string): ZonedScheduleParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const values: Record<string, string> = {};

  for (const part of formatter.formatToParts(new Date(instant))) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: values.month ?? '',
    day: Number(values.day),
    time: `${values.hour}:${values.minute}`,
  };
}

/**
 * One endpoint as a full wall-clock stamp in the schedule's own timezone, for
 * a tooltip that must not hide the exact instant: `Oct 4, 2026, 09:57`.
 */
export function formatScheduleDateTime(instant: string | Date, timezone: string): string {
  const {
    year, month, day, time,
  } = zonedScheduleParts(instant, timezone);

  return `${month} ${day}, ${year}, ${time}`;
}

/**
 * Renders a Promotion Period as a compact date range on the wall clock of the
 * timezone it was authored in, with the time of day left to the tooltip.
 *
 * Parts the two endpoints share are hoisted and printed once, so a schedule
 * reads as `Oct 15 – 23, 2026` rather than repeating the month. A shared year
 * is dropped only when it is the current year in that timezone; an instant in
 * any other year always shows its year. Endpoints in different years never
 * hoist the year, so `Dec 30, 2025 – Jan 2, 2026` can never leave either end
 * ambiguous.
 */
export function formatScheduleDateRange(
  startAt: string | Date,
  endAt: string | Date,
  timezone: string,
): string {
  const start = zonedScheduleParts(startAt, timezone);
  const end = zonedScheduleParts(endAt, timezone);
  const currentYear = zonedScheduleParts(new Date(), timezone).year;

  if (start.year !== end.year) {
    return `${start.month} ${start.day}, ${start.year} – ${end.month} ${end.day}, ${end.year}`;
  }

  const sharedYear = start.year === currentYear ? '' : `, ${start.year}`;

  if (start.month === end.month && start.day === end.day) {
    return `${start.month} ${start.day}${sharedYear}`;
  }

  if (start.month === end.month) {
    return `${start.month} ${start.day} – ${end.day}${sharedYear}`;
  }

  return `${start.month} ${start.day} – ${end.month} ${end.day}${sharedYear}`;
}
