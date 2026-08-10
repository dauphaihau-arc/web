import dayjs from 'dayjs';
import {
  defaultExportColumnIds,
  exportOrderColumns,
} from './export-orders-dialog.constants';
import {
  type ExportDateRange,
  buildExportDateRange,
  createDefaultCustomEndDate,
  createDefaultCustomStartDate,
  formatExportDateRangeSummary,
  formatExportFilenameTimestamp,
} from './export-orders-date-ranges';
import type { ExportShopOrdersRequest, ListShopOrdersRequest, ShopOrderExportResponse } from '~/domains/shop/api/order/contracts/order.contract';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';
import { createOrderExportEventsClient, type OrderExportSsePayload } from '~/domains/shop/order/order-export-events.client';
import {
  UTC_TIMEZONE,
  formatTimezoneOptionLabel,
  getDefaultDateFilterTimezone,
} from '~/app/components/date-filter-panel/date-filter-timezone';
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id';

type ExportColumnPreset = NonNullable<ExportShopOrdersRequest['column_preset']>;

type UseExportOrdersDialogOptions = {
  filters?: Partial<ListShopOrdersRequest>
};

export function useExportOrdersDialog(options: UseExportOrdersDialogOptions) {
  const dialog = useModal();
  const queryClient = useQueryClient();
  const toast = useToast();

  const exportDateRange = ref<ExportDateRange>('today');
  const timezoneName = ref(getDefaultDateFilterTimezone());
  const columnPreset = ref<ExportColumnPreset>('default');
  const customStartDate = ref(createDefaultCustomStartDate());
  const customEndDate = ref(createDefaultCustomEndDate());
  const selectedColumns = ref<string[]>([...defaultExportColumnIds]);
  const isExporting = ref(false);
  const activeExport = ref<ShopOrderExportResponse | null>(null);
  const progress = ref(0);
  const progressLabel = ref('');
  const eventClient = shallowRef<ReturnType<typeof createOrderExportEventsClient> | null>(null);
  const pollTimer = shallowRef<ReturnType<typeof setInterval> | null>(null);
  const isCompletingExport = ref(false);
  const isExportReady = computed(() => activeExport.value?.status === 'completed');

  const customDateRange = computed({
    get: () => ({
      start: dayjs(customStartDate.value).toDate(),
      end: dayjs(customEndDate.value).toDate(),
    }),
    set: (value: { start?: Date | null, end?: Date | null } | null) => {
      if (value?.start) {
        customStartDate.value = dayjs(value.start).format('YYYY-MM-DD');
      }

      if (value?.end) {
        customEndDate.value = dayjs(value.end).format('YYYY-MM-DD');
      }
    },
  });

  const customDateRangeLabel = computed(() => {
    const start = dayjs(customStartDate.value);
    const end = dayjs(customEndDate.value);

    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY');
    }

    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
  });

  const timezoneOptions = computed(() => {
    const localTimezone = getDefaultDateFilterTimezone();
    return Array.from(new Set([localTimezone, UTC_TIMEZONE])).map(value => ({
      id: value,
      label: formatTimezoneOptionLabel(value),
    }));
  });

  const dateRangeOptions = computed(() => [
    { value: 'today', label: 'Today', summary: formatRangeSummary('today') },
    { value: 'current_month', label: 'Current month', summary: formatRangeSummary('current_month') },
    { value: 'last_7_days', label: 'Last 7 days', summary: formatRangeSummary('last_7_days') },
    { value: 'last_4_weeks', label: 'Last 4 weeks', summary: formatRangeSummary('last_4_weeks') },
    { value: 'last_month', label: 'Last month', summary: formatRangeSummary('last_month') },
    { value: 'all', label: 'All', summary: '' },
    { value: 'custom', label: 'Custom', summary: formatRangeSummary('custom') },
  ] satisfies Array<{ value: ExportDateRange, label: string, summary: string }>);

  const selectedColumnLabels = computed(() => {
    const selected = columnPreset.value === 'custom'
      ? exportOrderColumns.filter(column => selectedColumns.value.includes(column.id))
      : exportOrderColumns.filter(column => column.default);

    return selected.map(column => column.label).join(', ');
  });

  const exportDisabled = computed(() =>
    columnPreset.value === 'custom' && selectedColumns.value.length === 0,
  );

  const actions = computed(() => {
    if (isExportReady.value) {
      return [
        {
          id: 'close',
          label: 'Close',
          variant: 'primary' as const,
          allowWhileInputFocused: true,
          run: () => dialog.close(),
        },
      ];
    }

    return [
      {
        id: 'cancel',
        label: 'Cancel',
        variant: 'secondary' as const,
        allowWhileInputFocused: true,
        run: () => dialog.close(),
      },
      {
        id: 'export',
        label: 'Export',
        variant: 'primary' as const,
        allowWhileInputFocused: true,
        loading: isExporting,
        disabled: computed(() => exportDisabled.value || activeExport.value !== null),
        run: exportOrders,
      },
    ];
  });

  onBeforeUnmount(() => {
    eventClient.value?.close();
    stopExportPolling();
  });

  watch(columnPreset, (preset) => {
    if (preset === 'custom' && selectedColumns.value.length === 0) {
      selectedColumns.value = [...defaultExportColumnIds];
    }
  });

  function isColumnSelected(columnId: string) {
    return selectedColumns.value.includes(columnId);
  }

  function toggleColumn(columnId: string, checked: boolean | 'indeterminate') {
    if (checked === 'indeterminate') {
      return;
    }

    if (checked) {
      selectedColumns.value = [...new Set([...selectedColumns.value, columnId])];
      return;
    }

    selectedColumns.value = selectedColumns.value.filter(selectedColumnId => selectedColumnId !== columnId);
  }

  async function exportOrders() {
    isExporting.value = true;

    try {
      const shopId = await resolveMyShopId(queryClient);
      const payload = buildExportRequest();
      const orderExport = await shopOrderApi.startExport(shopId, payload);
      activeExport.value = orderExport;
      applyExportState(orderExport);
      connectExportEvents(shopId, orderExport.id);
      startExportPolling(shopId, orderExport.id);
      await refreshExportState(shopId, orderExport.id);
    }
    catch {
      toast.add({
        title: 'Could not export orders',
        description: 'Try again in a moment.',
        color: 'red',
      });
    }
    finally {
      isExporting.value = false;
    }
  }

  function connectExportEvents(shopId: string, exportId: string) {
    eventClient.value?.close();
    eventClient.value = createOrderExportEventsClient((payload) => {
      void handleExportEvent(shopId, exportId, payload);
    });
  }

  function startExportPolling(shopId: string, exportId: string) {
    stopExportPolling();

    if (!import.meta.client) {
      return;
    }

    pollTimer.value = setInterval(() => {
      if (isCompletingExport.value || activeExport.value?.id !== exportId) {
        stopExportPolling();
        return;
      }

      void refreshExportState(shopId, exportId);
    }, 1_000);
  }

  function stopExportPolling() {
    if (!pollTimer.value) {
      return;
    }

    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }

  async function handleExportEvent(
    shopId: string,
    exportId: string,
    payload: OrderExportSsePayload,
  ) {
    if (payload.exportId !== exportId) {
      return;
    }

    if (payload.eventType === 'order_export.progress') {
      progress.value = typeof payload.percent === 'number' ? payload.percent : progress.value;
      progressLabel.value = `${payload.processedRows ?? 0} of ${payload.totalRows ?? 0} orders`;
      return;
    }

    if (payload.eventType === 'order_export.completed') {
      if (activeExport.value?.id === exportId) {
        activeExport.value = {
          ...activeExport.value,
          status: 'completed',
          filename: payload.filename ?? activeExport.value.filename,
          percent: 100,
        };
        progress.value = 100;
      }

      await completeExportDownload(shopId, exportId, payload.filename ?? activeExport.value?.filename);
      return;
    }

    if (payload.eventType === 'order_export.failed') {
      activeExport.value = activeExport.value
        ? { ...activeExport.value, status: 'failed', error_message: payload.message }
        : null;
      toast.add({
        title: 'Could not export orders',
        description: payload.message ?? 'Try again in a moment.',
        color: 'red',
      });
      eventClient.value?.close();
    }
  }

  async function refreshExportState(shopId: string, exportId: string) {
    const orderExport = await shopOrderApi.getExport(shopId, exportId);
    activeExport.value = orderExport;
    applyExportState(orderExport);

    if (orderExport.status === 'completed') {
      await completeExportDownload(shopId, exportId, orderExport.filename);
    }
    else if (orderExport.status === 'failed') {
      stopExportPolling();
      toast.add({
        title: 'Could not export orders',
        description: orderExport.error_message ?? 'Try again in a moment.',
        color: 'red',
      });
    }
  }

  function applyExportState(orderExport: ShopOrderExportResponse) {
    progress.value = orderExport.percent;
    progressLabel.value = `${orderExport.processed_rows} of ${orderExport.total_rows} rows`;
  }

  async function completeExportDownload(
    shopId: string,
    exportId: string,
    filename?: string,
  ) {
    if (isCompletingExport.value) {
      return;
    }

    isCompletingExport.value = true;
    stopExportPolling();
    try {
      const blob = await shopOrderApi.downloadExport(shopId, exportId);
      downloadBlob(blob, filename ?? `orders-${formatExportFilenameTimestamp()}.csv`);
      await queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['my-notifications-unread-count'] });
    }
    catch {
      toast.add({
        title: 'Could not download export',
        description: 'Try again in a moment.',
        color: 'red',
      });
    }
    finally {
      eventClient.value?.close();
      isCompletingExport.value = false;
    }
  }

  async function retryDownload() {
    if (!activeExport.value || activeExport.value.status !== 'completed') {
      return;
    }

    try {
      const shopId = await resolveMyShopId(queryClient);
      await completeExportDownload(shopId, activeExport.value.id, activeExport.value.filename);
    }
    catch {
      toast.add({
        title: 'Could not download export',
        description: 'Try again in a moment.',
        color: 'red',
      });
    }
  }

  function buildExportRequest(): ExportShopOrdersRequest {
    const range = buildCurrentDateRange();

    const payload: ExportShopOrdersRequest = {
      ...options.filters,
      page: undefined,
      limit: undefined,
      date_range: exportDateRange.value,
      timezone: timezoneName.value,
      column_preset: columnPreset.value,
    };

    if (range?.from) {
      payload.created_from = range.from.toISOString();
    }

    if (range?.to) {
      payload.created_to = range.to.toISOString();
    }

    if (columnPreset.value === 'custom') {
      payload.columns = [...selectedColumns.value];
    }

    return payload;
  }

  function formatRangeSummary(range: ExportDateRange) {
    return formatExportDateRangeSummary(
      buildExportDateRange(range, timezoneName.value, customStartDate.value, customEndDate.value),
    );
  }

  function buildCurrentDateRange() {
    return buildExportDateRange(
      exportDateRange.value,
      timezoneName.value,
      customStartDate.value,
      customEndDate.value,
    );
  }

  return {
    actions,
    columnPreset,
    customDateRange,
    customDateRangeLabel,
    customEndDate,
    customStartDate,
    dateRangeOptions,
    exportDateRange,
    activeExport,
    isCompletingExport,
    isExportReady,
    isColumnSelected,
    progress,
    progressLabel,
    retryDownload,
    selectedColumnLabels,
    selectedColumns,
    timezoneName,
    timezoneOptions,
    toggleColumn,
  };
}

function downloadBlob(blob: Blob, fallbackFilename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fallbackFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
