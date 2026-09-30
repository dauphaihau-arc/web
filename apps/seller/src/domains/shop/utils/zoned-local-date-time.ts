/**
 * Resolves the local wall-clock a seller types into the instants it maps to in
 * an explicit IANA timezone. It mirrors the server rule so the form can explain
 * a daylight-saving gap or ask which occurrence of a repeated local time the
 * seller meant, and always sends an explicit UTC offset for the server to
 * validate.
 */

export interface LocalDateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function parseLocalDateTime(
  value: string,
): LocalDateTimeParts | undefined {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);

  if (!match) {
    return undefined;
  }

  const parts: LocalDateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };

  if (
    parts.month < 1
    || parts.month > 12
    || parts.day < 1
    || parts.day > 31
    || parts.hour > 23
    || parts.minute > 59
  ) {
    return undefined;
  }

  return parts;
}

/**
 * Every instant at which the given wall clock occurs in `timeZone`: none for a
 * spring-forward gap, two for a fall-back repeat, otherwise exactly one.
 */
export function localDateTimeCandidates(
  parts: LocalDateTimeParts,
  timeZone: string,
): Date[] {
  const naiveMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  const offsets = new Set<number>([
    offsetMinutesAt(naiveMillis - 86_400_000, timeZone),
    offsetMinutesAt(naiveMillis, timeZone),
    offsetMinutesAt(naiveMillis + 86_400_000, timeZone),
  ]);
  const instants = new Set<number>();

  for (const offset of offsets) {
    const instant = naiveMillis - (offset * 60_000);

    if (sameParts(zonedParts(instant, timeZone), parts)) {
      instants.add(instant);
    }
  }

  return [...instants].sort((left, right) => left - right).map(
    instant => new Date(instant),
  );
}

/** The UTC offset (minutes east of UTC) a zone is on at an instant. */
export function offsetMinutesForInstant(instant: Date, timeZone: string): number {
  return offsetMinutesAt(instant.getTime(), timeZone);
}

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function supportedTimeZones(): string[] {
  return Intl.supportedValuesOf('timeZone');
}

function zonedParts(instantMillis: number, timeZone: string): LocalDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const values: Record<string, number> = {};

  for (const part of formatter.formatToParts(new Date(instantMillis))) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function offsetMinutesAt(instantMillis: number, timeZone: string): number {
  const parts = zonedParts(instantMillis, timeZone);
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );

  return Math.round((wallClockAsUtc - instantMillis) / 60_000);
}

function sameParts(
  left: LocalDateTimeParts,
  right: LocalDateTimeParts,
): boolean {
  return (
    left.year === right.year
    && left.month === right.month
    && left.day === right.day
    && left.hour === right.hour
    && left.minute === right.minute
  );
}
