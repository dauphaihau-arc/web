import { log } from '@arc/lib';
import enErrors from '~/i18n/locales/en/errors.json';
import {
  getBackendErrorCode,
  getBackendErrorMessage,
  getBackendErrorRequestId,
  getBackendErrorStatus,
} from './backend-error';

export type ErrorTranslator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export interface ErrorCopy {
  title: string
  description?: string
}

type MessageParams = Record<string, string | number>;

function lookupMessage(key: string): string | undefined {
  let node: unknown = enErrors;

  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return undefined;
    }

    node = (node as Record<string, unknown>)[segment];
  }

  return typeof node === 'string' ? node : undefined;
}

function interpolate(message: string, params?: MessageParams): string {
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params?.[name];

    return value === undefined ? placeholder : String(value);
  });
}

/**
 * English-catalog translator for the error area. It is the fallback for code
 * paths that run without a component-scoped i18n instance and the safety net
 * when a catalog loads without the `errors` area.
 */
export function translateError(
  key: string,
  params?: MessageParams,
): string {
  return interpolate(lookupMessage(key) ?? key, params);
}

/**
 * The single buyer-facing fallback for a failure the client cannot attribute to
 * a known code. It is deliberately generic: the server's English `message` is
 * never rendered.
 */
export function getGenericErrorCopy(t: ErrorTranslator = translateError): ErrorCopy {
  return {
    title: t('errors.generic.title'),
    description: t('errors.generic.description'),
  };
}

/**
 * Sends the raw server wording and correlation id to diagnostics only. Buyer
 * surfaces receive `getGenericErrorCopy` instead, so an unmapped code cannot
 * leak English API copy into the UI.
 */
export function reportApiError(error: unknown, context = 'API request failed'): void {
  const diagnostics = {
    code: getBackendErrorCode(error),
    message: getBackendErrorMessage(error),
    request_id: getBackendErrorRequestId(error),
    status: getBackendErrorStatus(error),
  };

  if (!diagnostics.code && !diagnostics.message && !diagnostics.request_id) {
    return;
  }

  log.error(context, diagnostics);
}

/**
 * Resolves the shared generic copy for an unexpected API failure while keeping
 * the raw payload in diagnostics.
 */
export function getUnexpectedErrorCopy(
  error: unknown,
  t: ErrorTranslator = translateError,
  context?: string,
): ErrorCopy {
  reportApiError(error, context);

  return getGenericErrorCopy(t);
}
