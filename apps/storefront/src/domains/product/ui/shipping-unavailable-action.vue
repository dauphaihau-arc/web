<script setup lang="ts">
import type { ShippingUnavailableKind } from '~/shared/utils/shipping-unavailable'
import { useMarketPreferencesDialog } from '~/shared/composables/use-market-preferences-dialog'

const props = withDefaults(defineProps<{
  kind: ShippingUnavailableKind
  internalLabel?: string
  internalTo?: string
  testId?: string
}>(), {
  internalLabel: undefined,
  internalTo: undefined,
  testId: 'shipping-unavailable-action',
})

const emit = defineEmits<{
  internalAction: []
}>()

const { t } = useI18n()
const { open } = useMarketPreferencesDialog()

const label = computed(() => {
  switch (props.kind) {
    case 'destination':
      return t('catalog.shipping.recovery.changeRegion')
    case 'currency':
      return t('catalog.shipping.recovery.changeCurrency')
    default:
      return props.internalLabel ?? t('catalog.shipping.recovery.messageSeller')
  }
})

function activate() {
  if (props.kind === 'unavailable') {
    emit('internalAction')
    return
  }

  open()
}
</script>

<template>
  <ULink
    v-if="kind === 'unavailable' && internalTo"
    :to="internalTo"
    :data-testid="testId"
    class="inline-flex text-sm font-medium text-state-danger-text underline underline-offset-2 hover:opacity-90"
  >
    {{ label }}
  </ULink>

  <UButton
    v-else
    :data-testid="testId"
    :padded="false"
    variant="link"
    size="sm"
    class="font-medium"
    @click="activate"
  >
    {{ label }}
  </UButton>
</template>
