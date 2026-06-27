import { FetchError } from 'ofetch';

type BackendErrorPayload = {
  message?: string | string[]
  statusMessage?: string
  code?: string
} | undefined;

function getBackendErrorPayload(error: unknown): BackendErrorPayload {
  if (!(error instanceof FetchError)) {
    return undefined;
  }

  return error.data as BackendErrorPayload;
}

export function getBackendErrorCode(error: unknown): string | undefined {
  const data = getBackendErrorPayload(error);

  if (typeof data?.code === 'string' && data.code.trim()) {
    return data.code;
  }

  return undefined;
}

export function getBackendErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof FetchError)) {
    return undefined;
  }

  const data = getBackendErrorPayload(error);

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
