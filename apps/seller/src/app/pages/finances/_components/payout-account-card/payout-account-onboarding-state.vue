<script setup lang="ts">
import Empty from '@arc/ui/patterns/empty.vue'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

defineProps<{
  /** The onboarding mutation or the hosted redirect is in flight. */
  isBusy: boolean
}>()

const emit = defineEmits<{
  'continue-onboarding': []
}>()
</script>

<template>
  <Empty
    icon="payment"
    size="lg"
    title="Set up payouts with Stripe"
    description="Stripe still needs your details and bank account before it can send payouts."
  >
    <template #actions>
      <UButton
        :icon="ICON_NAME_BY_ALIAS['externalLink']"
        :loading="isBusy"
        :disabled="isBusy"
        @click="emit('continue-onboarding')"
      >
        Continue with Stripe
      </UButton>
    </template>
  </Empty>
</template>
