<script setup lang="ts">
import type { ShopFinancePayoutSettings } from '~/domains/shop/api/finance/contracts/payout-settings.contract'
import { useUpdateShopFinancePayoutSettings } from '~/domains/shop/mutations/update-payout-settings.mutation'
import { readApiError } from '~/shared/lib/api-error'
import { toastCustom } from '~/shared/config/toast'

const props = defineProps<{
  settings: ShopFinancePayoutSettings
}>()

const toast = useToast()
const { mutateAsync: saveSettings, isPending } = useUpdateShopFinancePayoutSettings()

const INELIGIBLE_COPY: Record<string, string> = {
  no_payout_account: 'Add a payout account first.',
  payout_account_unverified: 'Payout account is not verified yet.',
  payout_account_disabled: 'Payout account is disabled.',
  payout_account_currency_mismatch: 'Payout account currency does not match your shop.',
  settlement_currency_unresolved: 'Shop currency could not be resolved.',
}

/**
 * A seller can always turn an enabled auto payout off. Turning it on needs a
 * usable destination the scheduled run could actually pay.
 */
const isLockedOff = computed(
  () => !props.settings.auto_payout_eligible && !props.settings.auto_payout_enabled,
)

const ineligibleCopy = computed(() => (
  props.settings.auto_payout_ineligible_reason
    ? (INELIGIBLE_COPY[props.settings.auto_payout_ineligible_reason]
      ?? 'Auto payout is unavailable right now.')
    : null
))

/** The stored value is the source of truth; the switch reflects it optimistically while saving. */
const isEnabled = ref(props.settings.auto_payout_enabled)

watch(() => props.settings.auto_payout_enabled, (value) => {
  isEnabled.value = value
})

async function onToggle(value: boolean) {
  if (value === props.settings.auto_payout_enabled) {
    return
  }

  isEnabled.value = value

  try {
    await saveSettings({ auto_payout_enabled: value })
    toast.add({
      ...toastCustom.success,
      title: value ? 'Auto payout turned on' : 'Auto payout turned off',
    })
  }
  catch (error) {
    isEnabled.value = props.settings.auto_payout_enabled
    const apiError = readApiError(error)
    toast.add({
      ...toastCustom.error,
      title: 'Unable to update auto payout',
      description: apiError.message ?? 'Try again in a moment.',
    })
  }
}
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <UToggle
      aria-label="Auto payout"
      :model-value="isEnabled"
      :disabled="isPending || isLockedOff"
      @update:model-value="onToggle"
    />
    <p
      v-if="isLockedOff && ineligibleCopy"
      class="text-right text-xs text-text-subtle"
    >
      {{ ineligibleCopy }}
    </p>
  </div>
</template>
