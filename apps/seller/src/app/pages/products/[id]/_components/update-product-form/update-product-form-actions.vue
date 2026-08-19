<script setup lang="ts">
import type { UpdateProductAction } from './use-update-product-submit'
import { routes } from '~/shared/navigation/routes'

defineProps<{
  canDeactivateFromDetail: boolean
  canPublishFromDetail: boolean
  disabledButtonSubmit: boolean
  loadingAction: UpdateProductAction | null
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
      :loading="loadingAction === 'save'"
      :disabled="disabledButtonSubmit || (loadingSubmit && loadingAction !== 'save')"
      size="md"
      type="submit"
      @click="$emit('submitAction', 'save')"
    >
      Update
    </UButton>
    <UButton
      v-if="canPublishFromDetail"
      :loading="loadingAction === 'publish'"
      :disabled="disabledButtonSubmit || !!publishImageError || (loadingSubmit && loadingAction !== 'publish')"
      size="md"
      type="submit"
      variant="subtle"
      @click="$emit('submitAction', 'publish')"
    >
      Publish
    </UButton>
    <UButton
      v-if="canDeactivateFromDetail"
      :loading="loadingAction === 'deactivate'"
      :disabled="disabledButtonSubmit || (loadingSubmit && loadingAction !== 'deactivate')"
      size="md"
      type="submit"
      variant="subtle"
      @click="$emit('submitAction', 'deactivate')"
    >
      Deactivate
    </UButton>
  </FixedFormActions>
</template>
