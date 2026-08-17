<script setup lang="ts">
import { ProductStates } from '@arc/enums/product'

defineProps<{
  enabledButtonSubmit: boolean
  hasImages: boolean
  loadingSubmit: boolean
  productState?: ProductStates
}>()

defineEmits<{
  cancel: []
  publish: []
  saveDraft: []
}>()
</script>

<template>
  <FixedFormActions>
    <UButton
      :disabled="loadingSubmit"
      size="md"
      color="gray"
      @click="$emit('cancel')"
    >
      Cancel
    </UButton>
    <UButton
      :disabled="!enabledButtonSubmit || loadingSubmit"
      :loading="loadingSubmit && productState === ProductStates.DRAFT"
      size="md"
      type="submit"
      variant="subtle"
      @click="$emit('saveDraft')"
    >
      Save draft
    </UButton>
    <UButton
      :disabled="!enabledButtonSubmit || !hasImages || loadingSubmit"
      :loading="loadingSubmit && productState === ProductStates.ACTIVE"
      size="md"
      type="submit"
      @click="$emit('publish')"
    >
      Publish
    </UButton>
  </FixedFormActions>
</template>
