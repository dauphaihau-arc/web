type ErrorEnvelope = {
  data?: unknown
  code?: unknown
  message?: unknown
  response?: Record<string, unknown> | undefined
};

/**
 * The machine-readable identity and the human text of an API rejection.
 * `code` is what a caller branches and writes copy from; `message` is the
 * server's own wording, kept for codes the client does not know yet.
 */
export interface ApiError {
  code?: string
  message?: string
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readMessage(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return readString(value);
  }

  if (!value || typeof value !== 'object' || !('message' in value)) {
    return undefined;
  }

  const { message } = value;

  if (typeof message === 'string') {
    return readString(message);
  }

  // A validation rejection carries one message per failed field.
  if (Array.isArray(message)) {
    const messages = message.filter((entry): entry is string => typeof entry === 'string');

    return messages.length > 0 ? messages.join(', ') : undefined;
  }

  return undefined;
}

/**
 * Normalizes a `$fetch` / normalized-error rejection into its code and message.
 *
 * `$fetch` rejects with the parsed body on `data`, while a rethrown or
 * normalized error keeps the same body on `response._data`; both envelopes are
 * read. The transport's own text (`[POST] "/api/v1/...": 409 Conflict`)
 * describes the request rather than the problem, so it is only used when the
 * failure never reached the server.
 */
export function readApiError(error: unknown): ApiError {
  if (typeof error === 'string') {
    return { message: readString(error) };
  }

  if (!error || typeof error !== 'object') {
    return {};
  }

  const envelope = error as ErrorEnvelope;
  let code: string | undefined;
  let message: string | undefined;

  for (const payload of [envelope.data, envelope.response?.['_data'], envelope.response]) {
    if (payload && typeof payload === 'object' && 'code' in payload) {
      code ??= readString(payload.code);
    }
    message ??= readMessage(payload);
  }

  return {
    code: code ?? readString(envelope.code),
    message: message ?? readString(envelope.message),
  };
}
