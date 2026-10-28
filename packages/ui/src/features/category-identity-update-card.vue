<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '../foundation/app-icon.constants'
import Empty from '../patterns/empty.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  checking?: boolean
  title?: string
  description?: string
  actionLabel?: string
}>(), {
  checking: false,
  title: 'Application update required',
  description: 'This app version is no longer compatible with the server’s category data, so category content is paused. Other pages keep working.',
  actionLabel: 'Check for update',
})

const emit = defineEmits<{
  check: []
}>()
</script>

<template>
  <Empty
    :icon="ICON_NAME_BY_ALIAS.warning"
    :title="props.title"
    :description="props.description"
    size="lg"
    data-testid="category-identity-update-card"
    aria-live="polite"
  >
    <template #actions>
      <UButton
        color="gray"
        size="sm"
        :loading="props.checking"
        :disabled="props.checking"
        data-testid="category-identity-check-update"
        @click="emit('check')"
      >
        {{ props.actionLabel }}
      </UButton>
    </template>
  </Empty>
</template>
