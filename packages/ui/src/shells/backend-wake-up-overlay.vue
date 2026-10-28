<script setup lang="ts">
import Empty from '../patterns/empty.vue'
import { ICON_NAME_BY_ALIAS } from '../foundation/app-icon.constants'

const props = defineProps<{
  isBackendPending: boolean
  isBackendError: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const shouldShowRetryAction = computed(() => props.isBackendError && !props.isBackendPending)

const title = computed(() =>
  shouldShowRetryAction.value ? 'We couldn’t connect' : 'Getting things ready',
)

const description = computed(() =>
  shouldShowRetryAction.value
    ? 'Check your connection, then try again.'
    : 'This can take a few seconds.',
)
</script>

<template>
  <div
    class="fixed inset-0 z-[100] grid place-content-center bg-surface px-4"
  >
    <Empty
      variant="naked"
      size="xl"
      :icon="ICON_NAME_BY_ALIAS.offline"
      :loading="isBackendPending"
      :title="title"
      :description="description"
    >
      <template
        v-if="shouldShowRetryAction"
        #actions
      >
        <UButton
          color="gray"
          size="sm"
          @click="emit('retry')"
        >
          Retry
        </UButton>
      </template>
    </Empty>
  </div>
</template>
