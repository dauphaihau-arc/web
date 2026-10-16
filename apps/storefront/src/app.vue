<script setup lang="ts">
import BackendWakeUpOverlay from '@arc/ui/shells/backend-wake-up-overlay.vue'

const { status, isUnknown, isPending, isError, waitForBackend } = useBackendStatus()
const queryClient = useQueryClient()

// The page renders unconditionally, on the server and on the client. It used to
// sit behind an `isReady` gate fed by a client-only readiness probe, which meant
// every route shipped a content-free splash and made hydration plus one API
// round trip a precondition for first paint. A sleeping backend is already
// reported by the API transport itself (`markWaking` on a wake-up error), so the
// overlay is driven by those states rather than replacing the page up front.
//
// The overlay still waits for the first client render: the probe can flip the
// status to `waking` before Nuxt finishes hydrating an async route (the category
// route is the reproducible case), and rendering an overlay into a tree the
// server rendered without one makes the client vdom disagree with the DOM.
const isHydrated = ref(false)
onMounted(() => {
  isHydrated.value = true
})

const shouldShowBackendOverlay = computed(
  () => isHydrated.value && (isPending.value || isError.value),
)

const retryBackend = () => {
  void waitForBackend({ force: true })
}

if (import.meta.client) {
  if (isUnknown.value) {
    void waitForBackend()
  }

  watch(
    () => status.value,
    (nextStatus, previousStatus) => {
      if (nextStatus !== 'ready' || previousStatus === 'ready') {
        return
      }

      // The page stays mounted while the backend is asleep, so its TanStack
      // queries have already settled in `error` and nothing refetches them on
      // their own — `refreshNuxtData` only covers Nuxt's own `useAsyncData`
      // keys. Without this, a recovered backend leaves the page on its empty
      // shell until the user reloads. Only errored queries are refetched: on a
      // healthy load the readiness probe flips to `ready` after some queries
      // have already succeeded, and refetching those would double every load.
      void queryClient.refetchQueries({
        type: 'active',
        predicate: query => query.state.status === 'error',
      })
      void refreshNuxtData()
    },
  )
}
</script>

<template>
  <div class="min-h-screen">
    <NuxtLayout class="min-h-screen">
      <NuxtPage />
    </NuxtLayout>

    <BackendWakeUpOverlay
      v-if="shouldShowBackendOverlay"
      :is-backend-pending="isPending"
      :is-backend-error="isError"
      @retry="retryBackend"
    />

    <UNotifications />
    <UModals />
  </div>
</template>

<style>
</style>
