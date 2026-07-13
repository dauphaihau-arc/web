import { computed, readonly } from 'vue'
import { useState } from '#app'

export type BackendStatus = 'unknown' | 'checking' | 'waking' | 'ready' | 'error'

export type UseBackendStatusOptions = {
  pingTimeoutMs?: number
  readyEndpoint?: string
  retryDelaysMs?: number[]
  stateKey?: string
}

const DEFAULT_READY_ENDPOINT = '/api/health/ready'
const DEFAULT_PING_TIMEOUT_MS = 10000
const DEFAULT_RETRY_DELAYS_MS = [1500, 2500, 4000, 6000]

const wakeUpPromises = new Map<string, Promise<boolean>>()

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useBackendStatus(options: UseBackendStatusOptions = {}) {
  const stateKey = options.stateKey ?? 'backend-status'
  const status = useState<BackendStatus>(stateKey, () => 'unknown')
  const isUnknown = computed(() => status.value === 'unknown')
  const isPending = computed(() => ['checking', 'waking'].includes(status.value))
  const isError = computed(() => status.value === 'error')
  const isReady = computed(() => status.value === 'ready')

  const setStatus = (nextStatus: BackendStatus) => {
    status.value = nextStatus
  }

  const markReady = () => {
    setStatus('ready')
  }

  const markWaking = () => {
    if (status.value !== 'ready' && status.value !== 'error') {
      setStatus('waking')
    }
  }

  const pingBackend = async () => {
    await $fetch(options.readyEndpoint ?? DEFAULT_READY_ENDPOINT, {
      retry: 0,
      timeout: options.pingTimeoutMs ?? DEFAULT_PING_TIMEOUT_MS,
    })
  }

  const waitForBackend = async (waitOptions?: { force?: boolean }) => {
    if (status.value === 'error' && !waitOptions?.force) {
      return false
    }

    const activeWakeUpPromise = wakeUpPromises.get(stateKey)

    if (activeWakeUpPromise) {
      return await activeWakeUpPromise
    }

    const wakeUpPromise = (async () => {
      const shouldKeepSplashDuringInitialCheck = status.value === 'unknown' && !waitOptions?.force
      const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS

      for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
        if (attempt === 0 && !shouldKeepSplashDuringInitialCheck) {
          setStatus('checking')
        }

        try {
          await pingBackend()
          markReady()
          return true
        }
        catch {
          setStatus('waking')

          if (attempt === retryDelaysMs.length - 1) {
            setStatus('error')
            return false
          }

          await sleep(retryDelaysMs[attempt])
        }
      }

      setStatus('error')
      return false
    })()

    wakeUpPromises.set(stateKey, wakeUpPromise)

    try {
      return await wakeUpPromise
    }
    finally {
      wakeUpPromises.delete(stateKey)
    }
  }

  return {
    status: readonly(status),
    isUnknown: readonly(isUnknown),
    isPending: readonly(isPending),
    isError: readonly(isError),
    isReady: readonly(isReady),
    markReady,
    markWaking,
    setStatus,
    waitForBackend,
  }
}
