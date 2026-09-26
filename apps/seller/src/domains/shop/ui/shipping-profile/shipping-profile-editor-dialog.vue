<script setup lang="ts">
import ShippingProfileEditor from './shipping-profile-editor/shipping-profile-editor.vue'
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'

const props = defineProps<{
  profile?: ShippingProfileResource
  shopCurrency?: string
}>()

const emit = defineEmits<{
  saved: [profile: ShippingProfileResource]
}>()

const editorRef = ref<InstanceType<typeof ShippingProfileEditor>>()
const title = computed(() => (props.profile ? 'Edit Shipping Profile' : 'Create Shipping Profile'))
</script>

<template>
  <BaseDialog
    :title="title"
    description="Reuse this profile across products. Rates and calendar-day ranges are evaluated in the order shown."
    body-class="min-h-0 flex-1 overflow-y-auto p-6"
  >
    <ShippingProfileEditor
      ref="editorRef"
      :profile="props.profile"
      :shop-currency="props.shopCurrency"
      @saved="emit('saved', $event)"
    />

    <template #footer>
      <DialogActions>
        <UButton
          type="button"
          color="gray"
          :disabled="editorRef?.isSubmitting"
          @click="editorRef?.cancel()"
        >
          Cancel
        </UButton>
        <UButton
          type="button"
          :loading="editorRef?.isSubmitting"
          @click="editorRef?.submit()"
        >
          {{ props.profile ? 'Save profile' : 'Create profile' }}
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
