<script setup lang="ts">
import AppSplash from '@arc/ui/shells/app-splash.vue'
import BackendWakeUpOverlay from '@arc/ui/shells/backend-wake-up-overlay.vue'

const { status, isUnknown, isPending, isError, isReady, waitForBackend } = useBackendStatus()
const queryClient = useQueryClient()

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
      void queryClient.resetQueries()
      void queryClient.invalidateQueries()
      void queryClient.refetchQueries({ type: 'active' })
    },
  )
}
</script>

<template>
  <div class="min-h-screen">
    <AppSplash v-if="isUnknown" />

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
