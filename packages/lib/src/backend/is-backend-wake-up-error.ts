import type { FetchError } from 'ofetch'
import { isCategoryIdentityMismatchError } from '../browser/category-identity'

function getStatusCode(error: unknown) {
  const fetchError = error as Partial<FetchError> & {
    response?: { status?: number }
    statusCode?: number
  }

  return fetchError.response?.status ?? fetchError.statusCode
}

export function isBackendWakeUpError(error: unknown) {
  // A confirmed category identity mismatch is a contract state of the running
  // client, not a sleeping backend. It is deliberately status-less, so without
  // this guard it would be misread as a wake-up error and put the whole app
  // behind the global backend overlay (looping health checks) instead of the
  // scoped, category-only update card.
  if (isCategoryIdentityMismatchError(error)) {
    return false
  }

  const statusCode = getStatusCode(error)

  if (!statusCode) {
    return true
  }

  return [502, 503, 504].includes(statusCode)
}
