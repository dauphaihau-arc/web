import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const UTC_TIMEZONE = 'UTC';

export function getDefaultDateFilterTimezone() {
  if (!import.meta.client) {
    return UTC_TIMEZONE;
  }

  return dayjs.tz.guess() || UTC_TIMEZONE;
}

export function formatTimezoneOptionLabel(timezoneName: string) {
  if (timezoneName === UTC_TIMEZONE) {
    return UTC_TIMEZONE;
  }

  return formatTimezoneOffsetLabel(timezoneName);
}

export function getNowInTimezone(timezoneName: string) {
  return dayjs().tz(normalizeTimezone(timezoneName));
}

export function toZonedDay(value: Date, timezoneName: string) {
  const calendarDate = dayjs(value).format('YYYY-MM-DD');
  return dayjs.tz(`${calendarDate}T00:00:00`, normalizeTimezone(timezoneName));
}

function formatTimezoneOffsetLabel(timezoneName: string) {
  const offsetMinutes = dayjs().tz(normalizeTimezone(timezoneName)).utcOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  if (minutes === 0) {
    return `GMT${sign}${hours}`;
  }

  return `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

function normalizeTimezone(timezoneName: string) {
  return timezoneName || UTC_TIMEZONE;
}
