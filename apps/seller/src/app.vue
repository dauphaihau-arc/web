<script setup lang="ts">
import BackendWakeUpOverlay from '~/shared/ui/backend-wake-up-overlay.vue'

const { status, waitForBackend } = useBackendStatus()

const isBackendPending = computed(() => ['checking', 'waking'].includes(status.value))
const isBackendError = computed(() => status.value === 'error')

const retryBackend = () => {
  void waitForBackend()
}
</script>

<template>
  <BackendWakeUpOverlay
    v-if="isBackendPending || isBackendError"
    :is-backend-pending="isBackendPending"
    :is-backend-error="isBackendError"
    @retry="retryBackend"
  />
  <NuxtLayout
    v-else
    class="min-h-screen"
  >
    <NuxtPage />
  </NuxtLayout>

  <UNotifications />
  <UModals />
</template>

<style>
</style>
