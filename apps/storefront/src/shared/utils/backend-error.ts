import { FetchError } from 'ofetch';

export function getBackendErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof FetchError)) {
    return undefined;
  }

  const data = error.data as {
    message?: string | string[]
    statusMessage?: string
  } | undefined;

  if (Array.isArray(data?.message)) {
    return data.message[0];
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.statusMessage === 'string' && data.statusMessage.trim()) {
    return data.statusMessage;
  }

  if (typeof error.statusMessage === 'string' && error.statusMessage.trim()) {
    return error.statusMessage;
  }

  return undefined;
}
