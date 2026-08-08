export type ProductImportSsePayload = {
  eventType?: string
  importId?: string
  status?: string
  processedRows?: number
  createdRows?: number
  failedRows?: number
  totalRows?: number
  percent?: number
  filename?: string
  message?: string
};

export function createProductImportEventsClient(
  onMessage: (payload: ProductImportSsePayload) => void
) {
  if (!import.meta.client) {
    return null;
  }

  const config = useRuntimeConfig();
  const baseUrl = `${config.public.apiBaseURL.replace(/\/+$/, '')}/v${config.public.apiVersion}`;
  const eventSource = new EventSource(`${baseUrl}/me/events`, {
    withCredentials: true,
  });

  eventSource.addEventListener('message', (event) => {
    try {
      onMessage(JSON.parse(event.data) as ProductImportSsePayload);
    }
    catch {
      // Ignore malformed event payloads from unrelated event producers.
    }
  });

  return {
    close: () => eventSource.close(),
  };
}
