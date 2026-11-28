<script setup lang="ts">
import type { ShippingUnavailableKind } from '~/shared/utils/shipping-unavailable'
import { useMarketPreferencesDialog } from '~/shared/composables/use-market-preferences-dialog'

const props = withDefaults(defineProps<{
  kind: ShippingUnavailableKind
  testId?: string
}>(), {
  testId: 'shipping-unavailable-action',
})

const { t } = useI18n()
const { open } = useMarketPreferencesDialog()

const label = computed(() => props.kind === 'destination'
  ? t('catalog.shipping.recovery.changeRegion')
  : t('catalog.shipping.recovery.changeCurrency'))
</script>

<template>
  <UButton
    v-if="kind !== 'unavailable'"
    :data-testid="testId"
    :padded="false"
    variant="link"
    size="sm"
    class="font-medium"
    @click="open"
  >
    {{ label }}
  </UButton>
</template>
