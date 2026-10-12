<script setup lang="ts">
import AppSplash from '@arc/ui/shells/app-splash.vue'
import BackendWakeUpOverlay from '@arc/ui/shells/backend-wake-up-overlay.vue'

const { status, isUnknown, isPending, isError, isReady, waitForBackend } = useBackendStatus()

// Backend readiness is resolved on the client, so the server always ships the
// splash. The first client render must therefore stay on the splash: if the
// readiness probe resolves before Nuxt finishes hydrating an async route (the
// category route is the reproducible case), rendering the layout early makes
// the client vdom disagree with the splash DOM, and Vue reuses the splash node
// for the layout root — nesting the whole market layout inside the fixed,
// viewport-centring splash overlay. Flip to the backend branch only after the
// initial hydration has settled.
const isHydrated = ref(false)
onMounted(() => {
  isHydrated.value = true
})

const shouldShowBackendOverlay = computed(() => !isUnknown.value && (isPending.value || isError.value))

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

      void refreshNuxtData()
    },
  )
}
</script>

<template>
  <div class="min-h-screen">
    <AppSplash v-if="!isHydrated || isUnknown" />

    <NuxtLayout
      v-else-if="isReady"
      class="min-h-screen"
    >
      <NuxtPage />
    </NuxtLayout>

    <BackendWakeUpOverlay
      v-else-if="shouldShowBackendOverlay"
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
