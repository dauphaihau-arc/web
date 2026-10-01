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
 * Renders a Promotion Period as one compact range on the wall clock of the
 * timezone it was authored in.
 *
 * Parts the two endpoints share — the month, the year, and the time of day —
 * are hoisted and printed once, so a schedule reads as `Oct 15 – 23, 11:59`
 * rather than repeating every field twice. A shared year is dropped only when
 * it is the current year in that timezone; an instant in any other year always
 * shows its year. Endpoints in different years never hoist the year, so
 * `Dec 30 – Jan 2` can never leave the year of either end ambiguous.
 */
export function formatScheduleRange(
  startAt: string | Date,
  endAt: string | Date,
  timezone: string,
): string {
  const start = zonedScheduleParts(startAt, timezone);
  const end = zonedScheduleParts(endAt, timezone);
  const currentYear = zonedScheduleParts(new Date(), timezone).year;

  const sameYear = start.year === end.year;
  const sameMonth = sameYear && start.month === end.month;
  const sameTime = start.time === end.time;

  if (!sameYear) {
    return `${start.month} ${start.day}, ${start.year}, ${start.time} – ${end.month} ${end.day}, ${end.year}, ${end.time}`;
  }

  const sharedYear = start.year === currentYear ? '' : `, ${start.year}`;

  if (sameMonth && start.day === end.day) {
    return `${start.month} ${start.day}${sharedYear}, ${start.time} – ${end.time}`;
  }

  if (sameMonth && sameTime) {
    return `${start.month} ${start.day} – ${end.day}${sharedYear}, ${start.time}`;
  }

  if (sameMonth) {
    return `${start.month} ${start.day}${sharedYear}, ${start.time} – ${end.day}, ${end.time}`;
  }

  if (sameTime) {
    return `${start.month} ${start.day} – ${end.month} ${end.day}${sharedYear}, ${start.time}`;
  }

  return `${start.month} ${start.day}${sharedYear}, ${start.time} – ${end.month} ${end.day}, ${end.time}`;
}
