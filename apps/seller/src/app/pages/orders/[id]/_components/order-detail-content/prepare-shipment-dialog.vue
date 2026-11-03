<script setup lang="ts">
import ShipmentItemQuantities from './shipment-item-quantities.vue'
import {
  carrierOptions,
  carrierTrackingError,
  carrierTrackingHint,
  carrierTrackingPlaceholder,
  findCarrier,
} from './carriers.presentation'
import {
  clampShipmentQuantity,
  remainingCapacityByItem,
  shipmentQuantityError,
} from './shipments.presentation'
import ShipmentRatePicker from './shipment-rate-picker.vue'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import { useCarriers } from '~/domains/shop/queries/carriers.query'
import { readApiError } from '~/shared/lib/api-error'
import type { ShipmentRateQuote } from '~/domains/shop/api/order/contracts/order.contract'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  group: ShopOrder['fulfillment']['groups'][number]
}>()

const dialog = useModal()
const { prepareShipment, buyLabel, requestShipmentRates } = useShopOrderFulfillmentMutations()
const { data: catalogue } = useCarriers()

const selectedRate = ref<ShipmentRateQuote>()
const buyError = ref('')
const ratePicker = ref<{ resetRates: () => void } | null>(null)

const form = reactive({
  carrier: '',
  trackingNumber: '',
  note: '',
})

type FulfillmentMethod = 'manual' | 'label'

type FulfillmentMethodOption = {
  value: FulfillmentMethod
  label: string
  hint: string
  testId: string
}

const methodOptions: FulfillmentMethodOption[] = [
  {
    value: 'manual',
    label: 'Manual tracking',
    hint: 'Use a carrier and tracking number you already have.',
    testId: 'shipment-method-manual',
  },
  {
    value: 'label',
    label: 'Buy a label',
    hint: 'Quote carrier rates from the parcel\'s weight and dimensions.',
    testId: 'shipment-method-label',
  },
]

const method = ref<FulfillmentMethod>('manual')

watch(method, () => {
  buyError.value = ''
})

const carriers = computed(() => catalogue.value?.carriers ?? [])
const carrierSelectOptions = computed(() => carrierOptions(carriers.value))

watch(() => form.carrier, () => {
  form.trackingNumber = ''
})

const selectedCarrier = computed(() => findCarrier(carriers.value, form.carrier))
const trackingHint = computed(() => carrierTrackingHint(selectedCarrier.value))
const trackingPlaceholder = computed(() => carrierTrackingPlaceholder(selectedCarrier.value))
const trackingError = computed(() => carrierTrackingError(selectedCarrier.value, form.trackingNumber))

const carrierDescription = computed(() =>
  carrierSelectOptions.value.length === 0
    ? 'Carrier list is unavailable right now. Reload the page to choose one.'
    : '',
)

const remaining = remainingCapacityByItem(props.group)

const rows = props.group.items.map((item) => {
  const max = Math.max(0, remaining.get(item.order_item_id) ?? 0)

  return {
    orderItemId: item.order_item_id,
    title: props.order.products.find(product => product.id === item.order_item_id)?.title
      ?? item.order_item_id,
    hint: `${max} remaining`,
    max,
  }
})

const quantities = ref<Record<string, number>>(
  Object.fromEntries(rows.map(row => [row.orderItemId, row.max])),
)

const selectedItems = computed(() => rows
  .map(row => ({
    order_item_id: row.orderItemId,
    quantity: clampShipmentQuantity(quantities.value[row.orderItemId], row.max),
  }))
  .filter(item => item.quantity > 0))

/**
 * A typed quantity the request builder would otherwise have to clamp is shown
 * to the seller instead of being silently shipped as something else; every
 * primary action stays disabled until it is settled.
 */
const quantityErrors = computed(() => {
  const errors: Record<string, string> = {}

  for (const row of rows) {
    const message = shipmentQuantityError(quantities.value[row.orderItemId], row.max)

    if (message) {
      errors[row.orderItemId] = message
    }
  }

  return errors
})

const hasQuantityError = computed(() => Object.keys(quantityErrors.value).length > 0)

async function prepare() {
  if (selectedItems.value.length === 0 || trackingError.value || hasQuantityError.value) return

  await prepareShipment.mutateAsync({
    orderId: props.order.id,
    body: {
      group_id: props.group.id,
      items: selectedItems.value,
      carrier: form.carrier || undefined,
      tracking_number: form.trackingNumber.trim() || undefined,
      shipment_note: form.note || undefined,
    },
  })

  await dialog.close()
}

/**
 * Buying a label is the only action here that creates a Shipment, so the
 * server decides what the quote is worth. An expired quote is not a dialog
 * failure: the seller is asked to fetch fresh rates and the stale options go
 * away.
 */
async function buy() {
  if (!selectedRate.value || selectedItems.value.length === 0 || hasQuantityError.value) return

  buyError.value = ''

  try {
    await buyLabel.mutateAsync({
      orderId: props.order.id,
      body: {
        quote_id: selectedRate.value.quote_id,
        group_id: props.group.id,
        items: selectedItems.value,
      },
    })
  }
  catch (error) {
    const apiError = readApiError(error)

    if (apiError.code === 'RATE_QUOTE_EXPIRED') {
      buyError.value = 'These rates have expired. Get rates again to choose a fresh quote.'
      ratePicker.value?.resetRates()
      return
    }

    buyError.value = apiError.message ?? 'Could not buy the label. Try again.'
    return
  }

  await dialog.close()
}

const actions = computed(() => {
  const pending = prepareShipment.isPending.value
    || buyLabel.isPending.value
    || requestShipmentRates.isPending.value

  const cancel = {
    id: 'cancel',
    label: 'Cancel',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: pending,
    run: () => dialog.close(),
  }

  if (method.value === 'label') {
    return [
      cancel,
      {
        id: 'buy-label',
        label: 'Buy label',
        disabled: !selectedRate.value
          || selectedItems.value.length === 0
          || hasQuantityError.value,
        loading: buyLabel.isPending.value,
        run: buy,
      },
    ]
  }

  return [
    cancel,
    {
      id: 'prepare',
      label: 'Prepare shipment',
      disabled: selectedItems.value.length === 0
        || Boolean(trackingError.value)
        || hasQuantityError.value,
      loading: prepareShipment.isPending.value,
      run: prepare,
    },
  ]
})
</script>

<template>
  <BaseDialog
    title="Prepare shipment"
    description="Select the quantities for this consignment. Preparing does not dispatch it, and only the remaining unassigned quantity can be prepared."
    width="w-full sm:max-w-2xl"
    :actions="actions"
  >
    <div class="space-y-6">
      <ShipmentItemQuantities
        v-model="quantities"
        :rows="rows"
        :errors="quantityErrors"
      />

      <div
        role="radiogroup"
        aria-label="Fulfillment method"
        data-testid="shipment-method"
        class="space-y-2"
      >
        <p class="text-sm font-medium text-text-strong">
          How do you want to fulfill this consignment?
        </p>
        <RadioGroupInput
          v-model="method"
          :options="methodOptions"
          value-attribute="value"
          option-attribute="label"
          name="fulfillment-method"
          :ui="{ container: '!grid gap-2 sm:grid-cols-2' }"
          :ui-radio="{
            wrapper: 'rounded-md border border-border-subtle p-3 has-[:checked]:border-border-muted has-[:checked]:bg-surface-subtle',
          }"
        >
          <template #label="{ option }">
            <span
              class="flex flex-col"
              :data-testid="option.testId"
            >
              <span class="text-sm font-medium text-text-strong">{{ option.label }}</span>
              <span class="text-xs text-text-muted">{{ option.hint }}</span>
            </span>
          </template>
        </RadioGroupInput>
      </div>

      <template v-if="method === 'manual'">
        <div class="grid gap-4 md:grid-cols-2">
          <UFormGroup
            label="Carrier"
            data-testid="shipment-carrier-field"
            :description="carrierDescription"
          >
            <USelectMenu
              v-model="form.carrier"
              data-testid="shipment-carrier-select"
              :options="carrierSelectOptions"
              :disabled="carrierSelectOptions.length === 0"
              value-attribute="value"
              name-attribute="label"
              placeholder="Select a carrier"
              searchable
            />
          </UFormGroup>
          <UFormGroup
            label="Tracking number"
            data-testid="shipment-tracking-number-field"
            :error="trackingError"
          >
            <UInput
              v-model="form.trackingNumber"
              data-testid="shipment-tracking-number"
              :placeholder="trackingPlaceholder"
            />
            <p
              v-if="trackingHint"
              data-testid="shipment-tracking-hint"
              class="mt-1 text-xs text-text-muted"
            >
              {{ trackingHint }}
            </p>
          </UFormGroup>
        </div>

        <UFormGroup label="Shipment note">
          <UTextarea
            v-model="form.note"
            :rows="2"
          />
        </UFormGroup>
      </template>

      <ShipmentRatePicker
        v-else
        ref="ratePicker"
        v-model:rate="selectedRate"
        :order-id="order.id"
      />

      <p
        v-if="method === 'label' && buyError"
        data-testid="label-purchase-error"
        class="text-sm text-red-600"
      >
        {{ buyError }}
      </p>
    </div>
  </BaseDialog>
</template>
