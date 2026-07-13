import type { FetchError } from 'ofetch'

function getStatusCode(error: unknown) {
  const fetchError = error as Partial<FetchError> & {
    response?: { status?: number }
    statusCode?: number
  }

  return fetchError.response?.status ?? fetchError.statusCode
}

export function isBackendWakeUpError(error: unknown) {
  const statusCode = getStatusCode(error)

  if (!statusCode) {
    return true
  }

  return [502, 503, 504].includes(statusCode)
}
