import type { FetchError } from 'ofetch'

type BackendStatus = 'unknown' | 'checking' | 'waking' | 'ready' | 'error'

const WAKE_UP_RETRY_DELAYS_MS = [1500, 2500, 4000, 6000]

let wakeUpPromise: Promise<boolean> | null = null

function getHealthBaseURL() {
  const config = useRuntimeConfig()
  return config.public.apiBaseURL
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

export function useBackendStatus() {
  const status = useState<BackendStatus>('backend-status', () => 'unknown')

  const setStatus = (nextStatus: BackendStatus) => {
    status.value = nextStatus
  }

  const markReady = () => {
    setStatus('ready')
  }

  const markWaking = () => {
    if (status.value !== 'ready') {
      setStatus('waking')
    }
  }

  const pingBackend = async () => {
    await $fetch('/health/ready', {
      baseURL: getHealthBaseURL(),
      credentials: 'include',
      retry: 0,
      timeout: 10000,
    })
  }

  const waitForBackend = async () => {
    if (wakeUpPromise) {
      return await wakeUpPromise
    }

    wakeUpPromise = (async () => {
      setStatus('checking')

      for (let attempt = 0; attempt < WAKE_UP_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          await pingBackend()
          markReady()
          return true
        }
        catch {
          setStatus('waking')

          if (attempt === WAKE_UP_RETRY_DELAYS_MS.length - 1) {
            setStatus('error')
            return false
          }

          await sleep(WAKE_UP_RETRY_DELAYS_MS[attempt])
        }
      }

      setStatus('error')
      return false
    })()

    try {
      return await wakeUpPromise
    }
    finally {
      wakeUpPromise = null
    }
  }

  return {
    status: readonly(status),
    markReady,
    markWaking,
    setStatus,
    waitForBackend,
  }
}
