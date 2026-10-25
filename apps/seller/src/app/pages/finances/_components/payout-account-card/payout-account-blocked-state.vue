<script setup lang="ts">
import Empty from '@arc/ui/primitives/empty.vue'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

defineProps<{
  /** The provider's status label, or the fallback title. */
  title: string
  /** Why the account cannot receive payouts. */
  description: string
  /** A restricted account can still be fixed through hosted onboarding. */
  isRestricted: boolean
  /** The onboarding mutation or the hosted redirect is in flight. */
  isBusy: boolean
  /** What the provider still needs, in plain words. */
  requirementTexts: string[]
}>()

const emit = defineEmits<{
  'continue-onboarding': []
}>()
</script>

<template>
  <Empty
    icon="payment"
    size="lg"
    :title="title"
    :description="description"
  >
    <template #body>
      <div class="w-full space-y-3 text-sm text-text-muted">
        <p v-if="isRestricted">
          Stripe needs more information before payouts can resume.
        </p>

        <div v-if="requirementTexts.length">
          <p class="font-medium text-text-strong">
            Stripe still needs:
          </p>
          <ul class="mt-1 list-disc space-y-1 pl-5">
            <li
              v-for="requirement in requirementTexts"
              :key="requirement"
            >
              {{ requirement }}
            </li>
          </ul>
        </div>

        <UButton
          v-if="isRestricted"
          :icon="ICON_NAME_BY_ALIAS['externalLink']"
          :loading="isBusy"
          :disabled="isBusy"
          @click="emit('continue-onboarding')"
        >
          Update details
        </UButton>

        <p class="text-xs text-text-subtle">
          Contact support if you need help with this account.
        </p>
      </div>
    </template>
  </Empty>
</template>
