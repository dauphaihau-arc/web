import type { components } from '@arc/schemas/api/generated/openapi'

export type ApiErrorResponse = components['schemas']['ApiErrorResponseDto']

type FetchErrorShape = {
  data?: unknown
  response?: {
    _data?: unknown
    data?: unknown
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const envelope = value as { status_code?: unknown; code?: unknown }

  return typeof envelope.status_code === 'number' && typeof envelope.code === 'string'
}

/**
 * Reads the backend's error envelope from ofetch's error shape.
 *
 * The body may arrive as `error.data` (direct `$fetch` failures), as
 * `error.response._data` (FetchError), or as `error.response.data` (plain
 * response objects). Returns `undefined` unless a candidate looks like the
 * documented envelope.
 */
export function getApiErrorResponse(error: unknown): ApiErrorResponse | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const fetchError = error as FetchErrorShape

  const candidates = [
    fetchError.data,
    fetchError.response?._data,
    fetchError.response?.data,
  ]

  return candidates.find(isApiErrorResponse)
}
