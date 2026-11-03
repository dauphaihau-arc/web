<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import { refundableCanceledLabels } from './canceled-label-refund.presentation'
import type { RefundableCanceledLabel } from './canceled-label-refund.presentation'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import { readApiError } from '~/shared/lib/api-error'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
}>()

/** Compact banner: the shipments card below carries the section weight. */
const cardUi = {
  body: { padding: 'p-4 sm:p-5' },
}

const { refundLabel } = useShopOrderFulfillmentMutations()

const labels = computed(() => refundableCanceledLabels(props.order))

/**
 * The confirmation is inline: refunding voids a paid label, so the first click
 * only asks, and the second one spends it.
 */
const confirmingShipmentId = ref<string>()
const pendingShipmentId = ref<string>()
const errorMessage = ref<string>()

const isRefunding = computed(
  () => Boolean(pendingShipmentId.value) || refundLabel.isPending.value,
)

function startConfirmation(shipmentId: string) {
  if (isRefunding.value) return

  errorMessage.value = undefined
  confirmingShipmentId.value = shipmentId
}

function cancelConfirmation() {
  if (isRefunding.value) return

  confirmingShipmentId.value = undefined
}

/**
 * The success path needs no UI bookkeeping: the mutation refetches the order,
 * the refunded label turns `voided`, and this banner unmounts itself.
 */
async function confirmRefund(entry: RefundableCanceledLabel) {
  if (isRefunding.value) return

  errorMessage.value = undefined
  pendingShipmentId.value = entry.shipmentId

  try {
    await refundLabel.mutateAsync({
      orderId: props.order.id,
      shipmentId: entry.shipmentId,
    })
    confirmingShipmentId.value = undefined
  }
  catch (error) {
    errorMessage.value = readApiError(error).message ?? 'Could not refund this label. Please try again.'
  }
  finally {
    pendingShipmentId.value = undefined
  }
}
</script>

<template>
  <UCard
    v-if="labels.length"
    data-testid="canceled-label-refunds"
    :ui="cardUi"
    class="border-amber-200 bg-amber-50/40"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <AppIcon
          name="lucide:rotate-ccw"
          size="sm"
          class="mt-0.5 shrink-0 text-amber-600"
        />
        <div class="space-y-1">
          <h2 class="font-semibold text-text-strong">
            Unused label
          </h2>
          <p class="text-sm text-text-muted">
            This order is closed, but its shipping
            {{ labels.length === 1 ? 'label was' : 'labels were' }}
            paid for and never scanned by the carrier. Refund
            {{ labels.length === 1 ? 'it' : 'them' }}
            to recover the charge; the shipment is voided with the label.
          </p>
        </div>
      </div>

      <ul class="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface">
        <li
          v-for="entry in labels"
          :key="entry.shipmentId"
          data-testid="canceled-label-row"
          class="flex flex-wrap items-center justify-between gap-3 p-3"
        >
          <div class="min-w-0 space-y-0.5">
            <div class="truncate text-sm font-medium text-text-strong">
              {{ entry.carrierName ?? 'Carrier' }}
              <span class="capitalize text-text-muted">· {{ entry.service }}</span>
            </div>
            <div class="truncate text-xs text-text-muted">
              Label {{ entry.labelPublicId }}
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-3">
            <span class="text-sm font-medium text-text-strong">
              {{ formatMinorCurrency(entry.priceMinor, entry.currency) }}
            </span>

            <template v-if="confirmingShipmentId === entry.shipmentId">
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                data-testid="refund-label-cancel"
                :disabled="isRefunding"
                @click="cancelConfirmation"
              >
                Keep label
              </UButton>
              <UButton
                color="red"
                size="xs"
                data-testid="refund-label-confirm"
                :loading="isRefunding"
                :disabled="isRefunding"
                :aria-label="`Confirm refund of label ${entry.labelPublicId}`"
                @click="confirmRefund(entry)"
              >
                Confirm refund
              </UButton>
            </template>

            <UButton
              v-else
              color="gray"
              variant="soft"
              size="xs"
              data-testid="refund-label"
              :disabled="isRefunding"
              :aria-label="`Refund label ${entry.labelPublicId}`"
              @click="startConfirmation(entry.shipmentId)"
            >
              Refund label
            </UButton>
          </div>
        </li>
      </ul>

      <p
        v-if="errorMessage"
        data-testid="refund-label-error"
        role="alert"
        class="text-sm text-red-600"
      >
        {{ errorMessage }}
      </p>
    </div>
  </UCard>
</template>
