import {
  buildProductImportPreview,
  type ProductImportPreviewRow,
} from './product-import-preview';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { ShopProductImportResponse, ShopProductImportStatus } from '~/domains/shop/api/product/contracts/import.contract';
import { createProductImportEventsClient, type ProductImportSsePayload } from '~/domains/shop/product/product-import-events.client';
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const IMPORT_WATCHDOG_INTERVAL_MS = 5_000;
const IMPORT_STALE_EVENT_THRESHOLD_MS = 15_000;

export function useProductImport() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const selectedFile = shallowRef<File | null>(null);
  const detectedRowCount = ref(0);
  const invalidPreviewRowCount = ref(0);
  const previewRows = ref<ProductImportPreviewRow[]>([]);
  const validationErrors = ref<string[]>([]);
  const isParsing = ref(false);
  const isDownloadingTemplate = ref(false);
  const isUploading = ref(false);
  const isDownloadingReport = ref(false);
  const activeImport = ref<ShopProductImportResponse | null>(null);
  const eventClient = shallowRef<ReturnType<typeof createProductImportEventsClient> | null>(null);
  const watchdogTimer = shallowRef<ReturnType<typeof setInterval> | null>(null);
  const lastImportEventAt = shallowRef<number | null>(null);

  const hasInvalidPreviewRows = computed(() => invalidPreviewRowCount.value > 0);

  const isImportRunning = computed(() =>
    activeImport.value?.status === 'queued' || activeImport.value?.status === 'processing',
  );

  const canStartImport = computed(() =>
    selectedFile.value !== null
    && validationErrors.value.length === 0
    && !hasInvalidPreviewRows.value
    && !isUploading.value
    && !isImportRunning.value,
  );

  const progressValue = computed(() => {
    const productImport = activeImport.value;

    if (!productImport || productImport.total_rows === 0) {
      return 0;
    }

    return Math.round((productImport.processed_rows / productImport.total_rows) * 100);
  });

  const progressLabel = computed(() => {
    const productImport = activeImport.value;

    if (!productImport) {
      return '';
    }

    return `${productImport.processed_rows} of ${productImport.total_rows} rows`;
  });

  onBeforeUnmount(() => {
    disconnectImportEvents();
    stopImportWatchdog();
  });

  async function selectFile(file: File) {
    selectedFile.value = file;
    activeImport.value = null;
    detectedRowCount.value = 0;
    invalidPreviewRowCount.value = 0;
    validationErrors.value = [];
    previewRows.value = [];
    isParsing.value = true;

    try {
      validateSelectedFile(file);
      const preview = await buildProductImportPreview(file);

      detectedRowCount.value = preview.totalRows;
      invalidPreviewRowCount.value = preview.invalidPreviewRowCount;
      previewRows.value = preview.rows;
    }
    catch (error) {
      validationErrors.value = [
        error instanceof Error ? error.message : 'Could not read this XLSX file.',
      ];
    }
    finally {
      isParsing.value = false;
    }
  }

  async function downloadTemplate() {
    isDownloadingTemplate.value = true;

    try {
      const shopId = await resolveMyShopId(queryClient);
      const blob = await shopProductApi.downloadImportTemplate(shopId);
      downloadBlob(blob, 'product-import-template.xlsx');
    }
    catch {
      toast.add({
        title: 'Could not download template',
        color: 'red',
      });
    }
    finally {
      isDownloadingTemplate.value = false;
    }
  }

  async function startImport() {
    if (!selectedFile.value) {
      return;
    }

    isUploading.value = true;

    try {
      const shopId = await resolveMyShopId(queryClient);
      const productImport = await shopProductApi.startImport(
        shopId,
        selectedFile.value,
        crypto.randomUUID(),
      );

      activeImport.value = productImport;
      connectImportEvents(shopId, productImport.id);
      startImportWatchdog(shopId, productImport.id);
      await refreshImport(shopId, productImport.id);
    }
    catch {
      toast.add({
        title: 'Could not start import',
        description: 'Check the file and try again.',
        color: 'red',
      });
    }
    finally {
      isUploading.value = false;
    }
  }

  async function downloadReport() {
    if (!activeImport.value) {
      return;
    }

    isDownloadingReport.value = true;

    try {
      const shopId = await resolveMyShopId(queryClient);
      const blob = await shopProductApi.downloadImportReport(shopId, activeImport.value.id);
      downloadBlob(blob, `product-import-${activeImport.value.id}.csv`);
    }
    catch {
      toast.add({
        title: 'Could not download report',
        color: 'red',
      });
    }
    finally {
      isDownloadingReport.value = false;
    }
  }

  function resetImport() {
    selectedFile.value = null;
    activeImport.value = null;
    detectedRowCount.value = 0;
    invalidPreviewRowCount.value = 0;
    previewRows.value = [];
    validationErrors.value = [];
    disconnectImportEvents();
    stopImportWatchdog();
  }

  function connectImportEvents(shopId: string, importId: string) {
    disconnectImportEvents();
    lastImportEventAt.value = Date.now();
    eventClient.value = createProductImportEventsClient((payload) => {
      void handleImportEvent(shopId, importId, payload);
    });
  }

  function disconnectImportEvents() {
    eventClient.value?.close();
    eventClient.value = null;
    lastImportEventAt.value = null;
  }

  function startImportWatchdog(shopId: string, importId: string) {
    stopImportWatchdog();

    if (!import.meta.client) {
      return;
    }

    watchdogTimer.value = setInterval(() => {
      if (!isImportRunning.value || activeImport.value?.id !== importId) {
        stopImportWatchdog();
        return;
      }

      const lastEventAt = lastImportEventAt.value;
      const isSseStale = lastEventAt === null || Date.now() - lastEventAt >= IMPORT_STALE_EVENT_THRESHOLD_MS;

      if (isSseStale) {
        lastImportEventAt.value = Date.now();
        void refreshImport(shopId, importId);
      }
    }, IMPORT_WATCHDOG_INTERVAL_MS);
  }

  function stopImportWatchdog() {
    if (!watchdogTimer.value) {
      return;
    }

    clearInterval(watchdogTimer.value);
    watchdogTimer.value = null;
  }

  async function refreshImport(shopId: string, importId: string) {
    const productImport = await shopProductApi.getImport(shopId, importId);
    activeImport.value = productImport;

    if (productImport.status === 'completed' || productImport.status === 'failed') {
      stopImportWatchdog();
      disconnectImportEvents();
      await queryClient.invalidateQueries({ queryKey: ['shop-get-products'] });
    }
  }

  async function handleImportEvent(
    shopId: string,
    importId: string,
    payload: ProductImportSsePayload,
  ) {
    if (payload.importId !== importId) {
      return;
    }

    lastImportEventAt.value = Date.now();
    applyImportEvent(payload);

    if (payload.eventType === 'product_import.completed' || payload.eventType === 'product_import.failed') {
      await refreshImport(shopId, importId);
    }
  }

  function applyImportEvent(payload: ProductImportSsePayload) {
    const currentImport = activeImport.value;

    if (!currentImport || currentImport.id !== payload.importId) {
      return;
    }

    const totalRows = payload.totalRows ?? currentImport.total_rows;
    const processedRows = payload.processedRows ?? currentImport.processed_rows;

    activeImport.value = {
      ...currentImport,
      status: toProductImportStatus(payload.status) ?? currentImport.status,
      processed_rows: processedRows,
      created_rows: payload.createdRows ?? currentImport.created_rows,
      failed_rows: payload.failedRows ?? currentImport.failed_rows,
      total_rows: totalRows,
      unprocessed_rows: Math.max(totalRows - processedRows, 0),
      error_message: payload.message ?? currentImport.error_message,
    };
  }

  return {
    activeImport,
    canStartImport,
    detectedRowCount,
    downloadReport,
    downloadTemplate,
    hasInvalidPreviewRows,
    invalidPreviewRowCount,
    isDownloadingReport,
    isDownloadingTemplate,
    isParsing,
    isUploading,
    previewRows,
    progressLabel,
    progressValue,
    resetImport,
    selectedFile,
    selectFile,
    startImport,
    validationErrors,
  };
}

function toProductImportStatus(status: string | undefined): ShopProductImportStatus | undefined {
  if (status === 'queued' || status === 'processing' || status === 'completed' || status === 'failed') {
    return status;
  }

  return undefined;
}

function validateSelectedFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new Error('Only XLSX files are supported.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('The selected file is larger than 10 MB.');
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
