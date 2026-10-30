<script setup lang="ts">
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import {
  orderPackageStatusText,
  orderPackageTone,
  type OrderPackage,
} from './order-detail-presentation'
import OrderItemLines from './order-item-lines.vue'
import PackageProgressSteps from './package-progress-steps.vue'

defineOptions({ name: 'OrderPackageCard' })

const props = withDefaults(defineProps<{
  orderPackage: OrderPackage
  showPackageIndex?: boolean
  showStages?: boolean
}>(), {
  showPackageIndex: true,
  showStages: true,
})

const trackingText = computed(() => {
  const { carrier, trackingNumber, state } = props.orderPackage

  if (carrier && trackingNumber) return `Carrier: ${carrier} · Tracking: ${trackingNumber}`
  if (trackingNumber) return `Tracking: ${trackingNumber}`
  if (carrier) return `Carrier: ${carrier}`
  if (state === 'preparing') return 'Tracking available once shipped'

  return ''
})

const visibleUpdates = computed(() => props.orderPackage.updates.slice(0, 3))

/** Each card owns its own toggle, so multi-package orders expand independently. */
const trackingOpen = ref(false)

const hasTrackingHistory = computed(() => visibleUpdates.value.length > 0)

/**
 * Preparing packages have nothing to track yet; every later state keeps its
 * history behind the toggle. The button styling stays identical across states.
 */
const showTrackingToggle = computed(() => hasTrackingHistory.value && props.orderPackage.state !== 'preparing')
</script>

<template>
  <UCard :ui="{ divide: 'divide-y-0' }">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-base font-medium text-text-strong">
          {{ showPackageIndex ? `Package ${orderPackage.index} of ${orderPackage.total}` : 'Shipment details' }}
        </h3>

        <StatusBadge
          v-if="showPackageIndex"
          :color="orderPackageTone(orderPackage)"
          :label="orderPackageStatusText(orderPackage)"
          size="sm"
          class="shrink-0 self-center"
        />
      </div>

      <div
        v-if="trackingText"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="text-sm text-text-subtle">{{ trackingText }}</span>
      </div>
    </div>

    <PackageProgressSteps
      v-if="showStages && orderPackage.stages.length"
      :stages="orderPackage.stages"
      :label="showPackageIndex ? `Package ${orderPackage.index} of ${orderPackage.total} progress` : 'Shipment progress'"
      class="mt-5"
    />

    <OrderItemLines
      :lines="orderPackage.lines"
      class="mt-5"
    />

    <div
      v-if="orderPackage.note"
      class="mt-5 rounded-md bg-surface-muted px-4 py-3 text-sm text-text-muted"
    >
      {{ orderPackage.note }}
    </div>

    <div
      v-if="showTrackingToggle || $slots.actions"
      class="mt-5 flex flex-wrap items-center gap-2"
    >
      <UButton
        v-if="showTrackingToggle"
        color="gray"
        size="sm"
        :trailing-icon="trackingOpen ? ICON_NAME_BY_ALIAS['chevronUp'] : ICON_NAME_BY_ALIAS['chevronDown']"
        :aria-expanded="trackingOpen"
        @click="trackingOpen = !trackingOpen"
      >
        Track package
      </UButton>

      <slot name="actions" />
    </div>

    <ol
      v-if="showTrackingToggle && trackingOpen"
      class="mt-5 space-y-3"
    >
      <li
        v-for="(update, updateIndex) in visibleUpdates"
        :key="update.id"
        class="flex gap-3"
      >
        <div class="flex flex-col items-center">
          <span class="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
          <span
            v-if="updateIndex < visibleUpdates.length - 1"
            aria-hidden="true"
            class="mt-1 w-px flex-1 bg-border-subtle"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-text-strong">
            {{ update.title }}
          </div>
          <div class="text-sm text-text-muted">
            {{ update.occurredAt }}
          </div>
        </div>
      </li>
    </ol>
  </UCard>
</template>
