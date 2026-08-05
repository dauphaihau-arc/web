export type OrderExportSsePayload = {
  eventType?: string
  exportId?: string
  status?: string
  processedRows?: number
  totalRows?: number
  percent?: number
  filename?: string
  message?: string
};

export function createOrderExportEventsClient(
  onMessage: (payload: OrderExportSsePayload) => void
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
      onMessage(JSON.parse(event.data) as OrderExportSsePayload);
    }
    catch {
      // Ignore malformed event payloads from unrelated event producers.
    }
  });

  return {
    close: () => eventSource.close(),
  };
}
