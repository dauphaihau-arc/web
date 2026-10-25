<script setup lang="ts">
import Empty from '@arc/ui/primitives/empty.vue'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

const emit = defineEmits<{
  /** The seller wants to open the country picker that starts Stripe onboarding. */
  setup: []
}>()
</script>

<template>
  <Empty
    icon="payment"
    size="lg"
    title="Get paid with Stripe"
    description="Stripe collects your details and bank account, then sends payouts straight to it."
  >
    <template #actions>
      <UButton
        :icon="ICON_NAME_BY_ALIAS['externalLink']"
        @click="emit('setup')"
      >
        Set up payouts with Stripe
      </UButton>
    </template>
  </Empty>
</template>
