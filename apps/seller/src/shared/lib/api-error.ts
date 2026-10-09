type ErrorEnvelope = {
  data?: unknown
  code?: unknown
  message?: unknown
  response?: Record<string, unknown> | undefined
};

/**
 * One request field a validation rejection named, with the server's wording
 * for it. `field` is the external snake_case request path, which matches the
 * form input `name` (e.g. `display_name`, `preferences.region`).
 */
export interface ApiErrorField {
  field: string
  message: string
}

/**
 * The machine-readable identity and the human text of an API rejection.
 * `code` is what a caller branches and writes copy from; `message` is the
 * server's own wording, kept for codes the client does not know yet. `fields`
 * carries a validation rejection's structured per-field errors.
 */
export interface ApiError {
  code?: string
  message?: string
  fields?: ApiErrorField[]
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readMessage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('message' in value)) {
    return undefined;
  }

  // The public envelope always carries a single summary string; structured
  // per-field errors live under `details.fields` rather than the message.
  return readString(value.message);
}

function readValidationFields(value: unknown): ApiErrorField[] | undefined {
  if (!value || typeof value !== 'object' || !('details' in value)) {
    return undefined;
  }

  const details = value.details;

  if (!details || typeof details !== 'object' || !('fields' in details) || !Array.isArray(details.fields)) {
    return undefined;
  }

  const fields = details.fields.flatMap((entry): ApiErrorField[] => {
    if (!entry || typeof entry !== 'object' || !('field' in entry) || !('messages' in entry)) {
      return [];
    }

    const name = readString(entry.field);
    const texts = Array.isArray(entry.messages)
      ? entry.messages.filter((message: unknown): message is string => typeof message === 'string' && message.length > 0)
      : [];

    return name && texts.length > 0
      ? [{ field: name, message: texts.join(', ') }]
      : [];
  });

  return fields.length > 0 ? fields : undefined;
}

/**
 * Normalizes a `$fetch` / normalized-error rejection into its code, message,
 * and validation fields.
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
  let fields: ApiErrorField[] | undefined;

  for (const payload of [envelope.data, envelope.response?.['_data'], envelope.response]) {
    if (payload && typeof payload === 'object' && 'code' in payload) {
      code ??= readString(payload.code);
    }
    message ??= readMessage(payload);
    fields ??= readValidationFields(payload);
  }

  const resolvedCode = code ?? readString(envelope.code);

  // A validation rejection's summary is deliberately generic; the per-field
  // wording lives in `details.fields`, so it is composed back into the display
  // message to keep the specific feedback. The summary stays the fallback.
  const validationMessage = resolvedCode === 'VALIDATION_FAILED' && fields
    ? fields.map(field => field.message).join(', ')
    : undefined;

  return {
    code: resolvedCode,
    message: validationMessage ?? message ?? readString(envelope.message),
    fields,
  };
}
