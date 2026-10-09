import { FetchError } from 'ofetch';

/**
 * The public API error envelope. `code` and `message` are always present on an
 * API rejection; `request_id` correlates a report to server logs and `details`
 * carries the structured, endpoint-specific fields (field errors, conflict
 * context) the caller reads instead of legacy top-level extras.
 */
type BackendErrorPayload = Partial<
  Record<'status_code', number> &
  Record<'code' | 'message' | 'request_id', string> &
  { details: Record<string, unknown> }
> | undefined;

function getBackendErrorPayload(error: unknown): BackendErrorPayload {
  if (!(error instanceof FetchError)) {
    return undefined;
  }

  const data = error.data;

  return data && typeof data === 'object' ? data as BackendErrorPayload : undefined;
}

/**
 * Joins the per-field wording a validation rejection carries in
 * `details.fields`, so the generic "Validation failed" summary does not hide
 * the specific feedback.
 */
function readValidationFieldsMessage(details: unknown): string | undefined {
  if (!details || typeof details !== 'object' || !('fields' in details) || !Array.isArray(details.fields)) {
    return undefined;
  }

  const messages = details.fields.flatMap((entry): string[] => {
    if (!entry || typeof entry !== 'object' || !('messages' in entry) || !Array.isArray(entry.messages)) {
      return [];
    }

    return entry.messages.filter((message: unknown): message is string => typeof message === 'string' && message.length > 0);
  });

  return messages.length > 0 ? messages.join(', ') : undefined;
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

  // A validation rejection's summary is deliberately generic; the per-field
  // wording lives in `details.fields`, so it is composed back into the display
  // message to keep the specific feedback. The summary stays the fallback.
  if (data?.code === 'VALIDATION_FAILED') {
    const validationMessage = readValidationFieldsMessage(data.details);

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  // The transport's own text describes the request rather than the problem, so
  // it is only used when the failure never reached the server.
  if (typeof error.statusMessage === 'string' && error.statusMessage.trim()) {
    return error.statusMessage;
  }

  return undefined;
}
