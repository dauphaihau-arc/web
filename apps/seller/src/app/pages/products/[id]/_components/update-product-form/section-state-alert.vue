<script setup lang="ts">
import { computed } from 'vue'
import type {
  ProductFormSectionId,
  ProductFormSectionState,
} from './use-update-product-form/use-update-product-submit/product-section-state'

const props = withDefaults(defineProps<{
  sectionId: ProductFormSectionId
  state: ProductFormSectionState
  label: string
  loadingRefresh?: boolean
  showUnavailableReapplyRefresh?: boolean
}>(), {
  loadingRefresh: false,
  showUnavailableReapplyRefresh: false,
})

const emit = defineEmits<{
  reapply: [sectionId: ProductFormSectionId]
  refresh: [sectionId: ProductFormSectionId]
}>()

const title = computed(() => props.state.conflict?.title ?? props.state.errorTitle ?? props.label)
const message = computed(() => props.state.conflict?.message ?? props.state.errorMessage)
const canReapply = computed(() => props.state.status === 'conflict' && props.state.conflict?.reapplyAvailable)
const canRefreshUnavailableReapply = computed(() => (
  props.showUnavailableReapplyRefresh
  && props.state.status === 'conflict'
  && props.state.conflict?.reapplyAvailable === false
))
</script>

<template>
  <div
    v-if="state.status !== 'idle'"
    class="mb-4 rounded-lg border border-border-muted p-3 text-sm"
    :data-section-state="state.status"
  >
    <p class="font-medium">
      {{ title }}
    </p>
    <p
      v-if="message"
      class="mt-1 text-text-muted"
    >
      {{ message }}
    </p>
    <div
      v-if="canReapply"
      class="mt-3 flex flex-wrap gap-2"
    >
      <UButton
        size="xs"
        variant="soft"
        @click="emit('reapply', sectionId)"
      >
        Keep my edits and save
      </UButton>
      <UButton
        size="xs"
        color="gray"
        variant="soft"
        :loading="loadingRefresh"
        @click="emit('refresh', sectionId)"
      >
        Refresh section
      </UButton>
    </div>
    <UButton
      v-if="canRefreshUnavailableReapply"
      class="mt-3"
      size="xs"
      variant="soft"
      :loading="loadingRefresh"
      @click="emit('refresh', sectionId)"
    >
      Refresh section
    </UButton>
  </div>
</template>
