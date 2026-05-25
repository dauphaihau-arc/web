<script lang="ts" setup>
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { toastCustom } from '~/shared/config/toast'
import { useWebPushNotifications } from '~/shared/composables/use-web-push-notifications'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const { data: currentUser } = useGetCurrentUser()
const toast = useToast()
const {
  status,
  permission,
  isSupported,
  isEnabled,
  syncStatusFromBrowser,
  enable,
  disable,
} = useWebPushNotifications()

const isPending = ref(false)

const notificationStatusLabel = computed(() => {
  switch (status.value) {
    case 'enabled':
      return 'Enabled'
    case 'blocked':
      return 'Blocked by browser'
    case 'unsupported':
      return 'Not supported on this browser'
    case 'syncing':
      return 'Updating...'
    case 'error':
      return 'Configuration error'
    case 'disabled':
    case 'idle':
    default:
      return 'Disabled'
  }
})

async function toggleBrowserNotifications() {
  if (isPending.value || !isSupported.value) {
    return
  }

  isPending.value = true

  try {
    if (isEnabled.value) {
      await disable()
      toast.add({
        ...toastCustom.success,
        title: 'Browser notifications disabled',
      })
    }
    else {
      const enabled = await enable()
      if (enabled) {
        toast.add({
          ...toastCustom.success,
          title: 'Browser notifications enabled',
        })
      }
    }
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: error instanceof Error ? error.message : 'Failed to update browser notifications',
    })
  }
  finally {
    isPending.value = false
    await syncStatusFromBrowser()
  }
}

onMounted(() => {
  void syncStatusFromBrowser()
})
</script>

<template>
  <div>
    <h3 class="text-2xl font-medium">
      Account
    </h3>
    <div class="mt-3 space-y-3">
      <div>
        <div class="font-medium">
          Name
        </div>
        <div class="font-light text-zinc-600">
          {{ currentUser?.user?.display_name }}
        </div>
      </div>
      <div>
        <div class="font-medium">
          Email
        </div>
        <div class="font-light text-zinc-600">
          {{ currentUser?.user?.email }}
        </div>
      </div>
      <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div class="space-y-1">
            <div class="font-medium">
              Browser notifications
            </div>
            <div class="text-sm text-zinc-600">
              Receive order updates as browser notifications when this device is subscribed.
            </div>
            <div class="text-sm text-zinc-500">
              Status: {{ notificationStatusLabel }}
            </div>
            <div
              v-if="permission === 'denied'"
              class="text-sm text-amber-600"
            >
              Browser permission is blocked. Re-enable notifications in your browser settings first.
            </div>
          </div>

          <UButton
            :disabled="!isSupported || isPending || status === 'syncing'"
            :loading="isPending || status === 'syncing'"
            :color="isEnabled ? 'gray' : 'primary'"
            @click="toggleBrowserNotifications"
          >
            {{ isEnabled ? 'Disable' : 'Enable' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
