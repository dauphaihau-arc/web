<script setup lang="ts">
import {
  MAX_PACKAGE_DIMENSION_CM,
  MAX_PACKAGE_WEIGHT_GRAMS,
  alternativeRates,
  defaultRateOption,
  packageFactsBody,
  packageFactsErrors,
  rateEstimatedDaysLabel,
  rateOptionLabel,
  rateTagsByQuoteId,
  sortRatesByPrice,
} from './rates.presentation'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import { useCarriers } from '~/domains/shop/queries/carriers.query'
import { formatMinorCurrency } from '@arc/utils'
import { readApiError } from '~/shared/lib/api-error'
import type { ShipmentRateQuote } from '~/domains/shop/api/order/contracts/order.contract'

const props = defineProps<{
  orderId: string
}>()

const { requestShipmentRates } = useShopOrderFulfillmentMutations()
const { data: catalogue } = useCarriers()

const packageForm = reactive({
  weightGrams: '' as number | '',
  lengthCm: '' as number | '',
  widthCm: '' as number | '',
  heightCm: '' as number | '',
})

const packageTouched = reactive({
  weightGrams: false,
  lengthCm: false,
  widthCm: false,
  heightCm: false,
})

const rawPackageErrors = computed(() => packageFactsErrors({
  weight_grams: packageForm.weightGrams,
  length_cm: packageForm.lengthCm,
  width_cm: packageForm.widthCm,
  height_cm: packageForm.heightCm,
}))

// A field only argues with the seller after they have visited it; an empty
// form is simply not ready, not four errors.
const packageErrors = computed(() => ({
  weight_grams: packageTouched.weightGrams ? rawPackageErrors.value.weight_grams : undefined,
  length_cm: packageTouched.lengthCm ? rawPackageErrors.value.length_cm : undefined,
  width_cm: packageTouched.widthCm ? rawPackageErrors.value.width_cm : undefined,
  height_cm: packageTouched.heightCm ? rawPackageErrors.value.height_cm : undefined,
}))

const packageValid = computed(() => Object.values(rawPackageErrors.value)
  .every(error => error === undefined))

const rates = ref<ShipmentRateQuote[]>([])
const selectedRate = defineModel<ShipmentRateQuote | undefined>('rate')
const ratesError = ref('')
const expanded = ref(false)

const rateTags = computed(() => rateTagsByQuoteId(rates.value))
const allRates = computed(() => sortRatesByPrice(rates.value))

const tagColor = {
  Cheapest: 'green',
  Fastest: 'yellow',
} as const

const primaryRate = computed(() => selectedRate.value)

const otherRates = computed(() => alternativeRates(rates.value, selectedRate.value))

function tagsFor(rate: ShipmentRateQuote) {
  return rateTags.value[rate.quote_id] ?? []
}

function selectRate(rate: ShipmentRateQuote) {
  selectedRate.value = rate
}

function resetRates() {
  rates.value = []
  selectedRate.value = undefined
  ratesError.value = ''
  expanded.value = false
}

function toggleExpanded() {
  expanded.value = !expanded.value
}

// The dialog clears the quotes when a purchase reports an expired quote.
defineExpose({ resetRates })

function carrierName(code: string): string {
  return catalogue.value?.carriers.find(carrier => carrier.code === code)?.name
    ?? code.toUpperCase()
}

// A quote describes one parcel: editing its facts invalidates every option.
watch(packageForm, () => {
  resetRates()
}, { flush: 'sync' })

/**
 * Quoting only reads carrier prices for package facts. It creates no Shipment
 * and changes no fulfillment state, so a failure is shown here instead of
 * closing the dialog or refetching the order.
 */
async function requestRates() {
  if (!packageValid.value) return

  ratesError.value = ''
  selectedRate.value = undefined

  try {
    const response = await requestShipmentRates.mutateAsync({
      orderId: props.orderId,
      body: packageFactsBody({
        weight_grams: packageForm.weightGrams,
        length_cm: packageForm.lengthCm,
        width_cm: packageForm.widthCm,
        height_cm: packageForm.heightCm,
      }),
    })

    rates.value = response.rates
    // A new quote list invalidates the old choice: start on the cheapest
    // standard option so "Buy label" is ready without an extra click.
    selectedRate.value = defaultRateOption(response.rates)
    expanded.value = false
  }
  catch (error) {
    rates.value = []
    selectedRate.value = undefined
    expanded.value = false
    ratesError.value = readApiError(error).message ?? 'Could not fetch shipping rates. Try again.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2">
      <UFormGroup
        label="Weight (g)"
        :error="packageErrors.weight_grams"
      >
        <UInput
          v-model.number="packageForm.weightGrams"
          data-testid="package-weight"
          type="number"
          :disabled="requestShipmentRates.isPending.value"
          inputmode="numeric"
          :min="1"
          :max="MAX_PACKAGE_WEIGHT_GRAMS"
          placeholder="e.g. 800"
          @blur="packageTouched.weightGrams = true"
        />
      </UFormGroup>
      <UFormGroup
        label="Length (cm)"
        :error="packageErrors.length_cm"
      >
        <UInput
          v-model.number="packageForm.lengthCm"
          data-testid="package-length"
          type="number"
          :disabled="requestShipmentRates.isPending.value"
          inputmode="numeric"
          :min="1"
          :max="MAX_PACKAGE_DIMENSION_CM"
          placeholder="e.g. 30"
          @blur="packageTouched.lengthCm = true"
        />
      </UFormGroup>
      <UFormGroup
        label="Width (cm)"
        :error="packageErrors.width_cm"
      >
        <UInput
          v-model.number="packageForm.widthCm"
          data-testid="package-width"
          type="number"
          :disabled="requestShipmentRates.isPending.value"
          inputmode="numeric"
          :min="1"
          :max="MAX_PACKAGE_DIMENSION_CM"
          placeholder="e.g. 20"
          @blur="packageTouched.widthCm = true"
        />
      </UFormGroup>
      <UFormGroup
        label="Height (cm)"
        :error="packageErrors.height_cm"
      >
        <UInput
          v-model.number="packageForm.heightCm"
          data-testid="package-height"
          type="number"
          :disabled="requestShipmentRates.isPending.value"
          inputmode="numeric"
          :min="1"
          :max="MAX_PACKAGE_DIMENSION_CM"
          placeholder="e.g. 10"
          @blur="packageTouched.heightCm = true"
        />
      </UFormGroup>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UButton
        data-testid="request-rates"
        size="sm"
        :disabled="!packageValid || requestShipmentRates.isPending.value"
        :loading="requestShipmentRates.isPending.value"
        @click="requestRates"
      >
        Get rates
      </UButton>
      <p class="text-xs text-text-muted">
        Rates expire 15 minutes after they are quoted.
      </p>
    </div>

    <p
      v-if="ratesError"
      data-testid="rates-error"
      class="text-sm text-red-600"
    >
      {{ ratesError }}
    </p>

    <div
      v-if="rates.length > 0"
      data-testid="rate-options"
      class="space-y-2"
    >
      <p class="text-sm font-medium text-text-strong">
        Carrier rates
      </p>

      <div
        v-if="primaryRate && !expanded"
        data-testid="primary-rate"
        class="flex w-full items-center justify-between gap-4 rounded-md border border-border-muted bg-surface-subtle p-4"
      >
        <span>
          <span class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-text-strong">
              {{ rateOptionLabel(primaryRate, carrierName(primaryRate.carrier)) }}
            </span>
            <StatusBadge
              v-for="tag in tagsFor(primaryRate)"
              :key="tag"
              :label="tag"
              :color="tagColor[tag]"
            />
          </span>
          <span class="block text-xs text-text-muted">{{ rateEstimatedDaysLabel(primaryRate) }}</span>
        </span>
        <span class="text-sm font-semibold text-text-strong">
          {{ formatMinorCurrency(primaryRate.price_minor, primaryRate.currency) }}
        </span>
      </div>

      <UButton
        v-if="otherRates.length > 0"
        color="gray"
        variant="soft"
        size="xs"
        data-testid="toggle-rate-options"
        :aria-expanded="expanded"
        :trailing-icon="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
        @click="toggleExpanded"
      >
        {{ expanded
          ? 'Hide options'
          : `Show ${otherRates.length} other option${otherRates.length === 1 ? '' : 's'}` }}
      </UButton>

      <div
        v-if="expanded"
        data-testid="other-rate-options"
        class="space-y-2"
      >
        <button
          v-for="rate in allRates"
          :key="rate.quote_id"
          type="button"
          data-testid="rate-option"
          :aria-pressed="selectedRate?.quote_id === rate.quote_id"
          class="flex w-full items-center justify-between gap-4 rounded-md border p-3 text-left"
          :class="selectedRate?.quote_id === rate.quote_id ? 'border-border-muted bg-surface-subtle' : 'border-border-subtle'"
          @click="selectRate(rate)"
        >
          <span>
            <span class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium text-text-strong">
                {{ rateOptionLabel(rate, carrierName(rate.carrier)) }}
              </span>
              <StatusBadge
                v-for="tag in tagsFor(rate)"
                :key="tag"
                :label="tag"
                :color="tagColor[tag]"
              />
            </span>
            <span class="block text-xs text-text-muted">{{ rateEstimatedDaysLabel(rate) }}</span>
          </span>
          <span class="text-sm font-semibold text-text-strong">
            {{ formatMinorCurrency(rate.price_minor, rate.currency) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
