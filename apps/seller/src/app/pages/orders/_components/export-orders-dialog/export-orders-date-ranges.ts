import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { ExportShopOrdersRequest } from '~/domains/shop/api/order/contracts/order.contract';
import {
  getNowInTimezone,
} from '~/app/components/date-filter-panel/date-filter-timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type ExportDateRange = NonNullable<ExportShopOrdersRequest['date_range']>;

export function createDefaultCustomStartDate() {
  return dayjs().startOf('year').format('YYYY-MM-DD');
}

export function createDefaultCustomEndDate() {
  return dayjs().format('YYYY-MM-DD');
}

export function buildExportDateRange(
  range: ExportDateRange,
  timezoneName: string,
  customStartDate: string,
  customEndDate: string,
) {
  const now = getNowInTimezone(timezoneName);

  switch (range) {
    case 'today':
      return {
        from: now.startOf('day'),
        to: now.endOf('day'),
      };
    case 'current_month':
      return {
        from: now.startOf('month'),
        to: now.endOf('day'),
      };
    case 'last_7_days':
      return {
        from: now.subtract(6, 'day').startOf('day'),
        to: now.endOf('day'),
      };
    case 'last_4_weeks':
      return {
        from: now.subtract(27, 'day').startOf('day'),
        to: now.endOf('day'),
      };
    case 'last_month': {
      const previousMonth = now.subtract(1, 'month');
      return {
        from: previousMonth.startOf('month'),
        to: previousMonth.endOf('month'),
      };
    }
    case 'custom': {
      const from = dayjs.tz(`${customStartDate}T00:00:00`, timezoneName);
      const to = dayjs.tz(`${customEndDate}T23:59:59`, timezoneName);
      return { from, to };
    }
    case 'all':
      return null;
  }
}

export function formatExportDateRangeSummary(
  range: ReturnType<typeof buildExportDateRange>,
) {
  if (!range) {
    return '';
  }

  if (range.from.isSame(range.to, 'day')) {
    return range.from.format('MMM D');
  }

  return `${range.from.format('MMM D')} - ${range.to.format('MMM D')}`;
}

export function formatExportFilenameTimestamp() {
  return dayjs().format('YYYYMMDD-HHmmss');
}
