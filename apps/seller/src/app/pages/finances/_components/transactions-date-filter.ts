import dayjs from 'dayjs';
import {
  getNowInTimezone,
  toZonedDay,
  UTC_TIMEZONE,
} from '~/shared/ui/date-filter/date-filter-timezone';
import type { OrderDateFilterDraft } from '~/shared/ui/date-filter/filter-draft.types';

/** Typed date range in ISO 8601 timestamps, ready for the transactions API. */
export type TransactionsDateRange = {
  from?: string
  to?: string
};

export function createDefaultTransactionsDateFilter(): OrderDateFilterDraft {
  return {
    operator: 'in_last',
    amount: '',
    unit: 'days',
    date: null,
    startDate: null,
    endDate: null,
    includeTime: false,
    time: '00:00',
    startTime: '00:00',
    endTime: '23:59',
    timezone: UTC_TIMEZONE,
  };
}

export function isTransactionsDateFilterValid(filter: OrderDateFilterDraft) {
  switch (filter.operator) {
    case 'in_last': {
      const amount = Number(filter.amount);
      return Number.isFinite(amount) && amount > 0;
    }
    case 'eq':
    case 'gte':
    case 'lte':
      return filter.date instanceof Date
        && !Number.isNaN(filter.date.valueOf())
        && (!filter.includeTime || isValidTime(filter.time));
    case 'between':
      return !!filter.startDate
        && !!filter.endDate
        && !Number.isNaN(filter.startDate.valueOf())
        && !Number.isNaN(filter.endDate.valueOf())
        && (!filter.includeTime || (isValidTime(filter.startTime) && isValidTime(filter.endTime)))
        && (
          dayjs(filter.endDate).isSame(dayjs(filter.startDate))
          || dayjs(filter.endDate).isAfter(dayjs(filter.startDate))
        );
    default:
      return false;
  }
}

export function buildTransactionsDateRange(filter: OrderDateFilterDraft): TransactionsDateRange {
  const now = getNowInTimezone(filter.timezone);

  switch (filter.operator) {
    case 'in_last':
      return {
        from: now.subtract(Number(filter.amount), filter.unit).toISOString(),
        to: now.toISOString(),
      };
    case 'eq': {
      if (!filter.date) {
        return {};
      }

      const selected = toZonedDay(filter.date, filter.timezone);

      if (filter.includeTime) {
        const selectedAtTime = applyTimeToDay(selected, filter.time);
        return {
          from: selectedAtTime.startOf('minute').toISOString(),
          to: selectedAtTime.endOf('minute').toISOString(),
        };
      }

      return {
        from: selected.startOf('day').toISOString(),
        to: selected.endOf('day').toISOString(),
      };
    }
    case 'between': {
      if (!filter.startDate || !filter.endDate) {
        return {};
      }

      const start = toZonedDay(filter.startDate, filter.timezone);
      const end = toZonedDay(filter.endDate, filter.timezone);

      return {
        from: (
          filter.includeTime
            ? applyTimeToDay(start, filter.startTime)
            : start.startOf('day')
        ).toISOString(),
        to: (
          filter.includeTime
            ? applyTimeToDay(end, filter.endTime)
            : end.endOf('day')
        ).toISOString(),
      };
    }
    case 'gte': {
      if (!filter.date) {
        return {};
      }

      const selected = toZonedDay(filter.date, filter.timezone);
      return {
        from: (
          filter.includeTime
            ? applyTimeToDay(selected, filter.time).startOf('minute')
            : selected.startOf('day')
        ).toISOString(),
      };
    }
    case 'lte': {
      if (!filter.date) {
        return {};
      }

      const selected = toZonedDay(filter.date, filter.timezone);
      return {
        to: (
          filter.includeTime
            ? applyTimeToDay(selected, filter.time).endOf('minute')
            : selected.endOf('day')
        ).toISOString(),
      };
    }
    default:
      return {};
  }
}

export function formatTransactionsDateFilterSummary(filter: OrderDateFilterDraft | null) {
  if (!filter) {
    return undefined;
  }

  switch (filter.operator) {
    case 'in_last':
      return `Last ${filter.amount} ${filter.unit}`;
    case 'eq':
      return formatAbsoluteDateSummary(filter.date, filter.includeTime, filter.time, filter.timezone);
    case 'between':
      if (!filter.startDate || !filter.endDate) {
        return undefined;
      }
      return `${formatAbsoluteDateSummary(filter.startDate, filter.includeTime, filter.startTime, filter.timezone)} - ${formatAbsoluteDateSummary(filter.endDate, filter.includeTime, filter.endTime, filter.timezone)}`;
    case 'gte':
      return `On or after ${formatAbsoluteDateSummary(filter.date, filter.includeTime, filter.time, filter.timezone)}`;
    case 'lte':
      return `Before or on ${formatAbsoluteDateSummary(filter.date, filter.includeTime, filter.time, filter.timezone)}`;
    default:
      return undefined;
  }
}

function applyTimeToDay(value: dayjs.Dayjs, time: string) {
  const [hoursRaw = '0', minutesRaw = '0'] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  return value
    .hour(Number.isFinite(hours) ? hours : 0)
    .minute(Number.isFinite(minutes) ? minutes : 0)
    .second(0)
    .millisecond(0);
}

function formatAbsoluteDateSummary(
  value: Date | null,
  includeTime: boolean,
  time: string,
  timezoneName: OrderDateFilterDraft['timezone'],
) {
  if (!value) {
    return undefined;
  }

  const base = toZonedDay(value, timezoneName);

  if (!includeTime) {
    return base.format('MMM D, YYYY');
  }

  return applyTimeToDay(base, time).format('MMM D, YYYY hh:mm A');
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}
