<script setup lang="ts">
import type { UpdateProductAction } from './use-update-product-submit'
import { routes } from '~/shared/navigation/routes'

defineProps<{
  canDeactivateFromDetail: boolean
  canPublishFromDetail: boolean
  disabledButtonSubmit: boolean
  loadingSubmit: boolean
  publishImageError: string
}>()

defineEmits<{
  submitAction: [action: UpdateProductAction]
}>()
</script>

<template>
  <FixedFormActions>
    <UButton
      :disabled="loadingSubmit"
      size="md"
      color="gray"
      :to="routes.products()"
    >
      Cancel
    </UButton>
    <UButton
      :loading="loadingSubmit"
      :disabled="disabledButtonSubmit"
      size="md"
      type="submit"
      @click="$emit('submitAction', 'save')"
    >
      Update
    </UButton>
    <UButton
      v-if="canPublishFromDetail"
      :loading="loadingSubmit"
      :disabled="disabledButtonSubmit || !!publishImageError"
      size="md"
      color="emerald"
      type="submit"
      @click="$emit('submitAction', 'publish')"
    >
      Save & publish
    </UButton>
    <UButton
      v-if="canDeactivateFromDetail"
      :loading="loadingSubmit"
      :disabled="disabledButtonSubmit"
      size="md"
      color="amber"
      variant="soft"
      type="submit"
      @click="$emit('submitAction', 'deactivate')"
    >
      Save & deactivate
    </UButton>
  </FixedFormActions>
</template>
