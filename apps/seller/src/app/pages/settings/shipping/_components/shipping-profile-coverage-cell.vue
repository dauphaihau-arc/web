<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { ComponentPublicInstance } from 'vue'
import { ShippingDestinationScopes } from '@arc/enums/shipping'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'

type ShippingRate = ShippingProfileResource['rates'][number]

const props = defineProps<{
  profile: ShippingProfileResource
}>()

/** Destinations a seller can scan on one line; the rest stay behind the disclosure. */
const coveragePreviewLimit = 2

function destinationLabel(rate: ShippingRate) {
  if (rate.destination_scope === ShippingDestinationScopes.COUNTRY) {
    return rate.destination_country ?? 'Country'
  }

  return 'Everywhere else'
}

function feeLabel(rate: ShippingRate) {
  if (rate.one_item_fee_minor === 0 && rate.additional_item_fee_minor === 0) {
    return 'Free shipping'
  }

  return `${formatMinorCurrency(rate.one_item_fee_minor, props.profile.currency)} first · ${formatMinorCurrency(rate.additional_item_fee_minor, props.profile.currency)} additional`
}

function deliveryTimeLabel(rate: ShippingRate) {
  if (rate.delivery_time_min_days === undefined || rate.delivery_time_max_days === undefined) {
    return 'Delivery time not set'
  }

  return `${rate.delivery_time_min_days}–${rate.delivery_time_max_days} days in transit`
}

const destinations = computed(() => props.profile.rates
  .slice(0, coveragePreviewLimit)
  .map(destinationLabel)
  .join(' · '))

const hiddenDestinationCount = computed(() => Math.max(0, props.profile.rates.length - coveragePreviewLimit))

/** A single rate is fully shown inline; the disclosure only exists when something is hidden. */
const hasHiddenRates = computed(() => props.profile.rates.length > 1)

/**
 * The cheapest rate is what a seller compares profiles by; the rate's position
 * inside the profile is an implementation detail.
 */
const cheapestRate = computed(() => props.profile.rates.reduce<ShippingRate | undefined>((cheapest, rate) => {
  if (!cheapest) {
    return rate
  }

  if (rate.one_item_fee_minor !== cheapest.one_item_fee_minor) {
    return rate.one_item_fee_minor < cheapest.one_item_fee_minor ? rate : cheapest
  }

  return rate.additional_item_fee_minor < cheapest.additional_item_fee_minor ? rate : cheapest
}, undefined))

const rateSummary = computed(() => {
  const rate = cheapestRate.value

  if (!rate) {
    return ''
  }

  if (rate.one_item_fee_minor === 0 && rate.additional_item_fee_minor === 0) {
    return `Free shipping · ${deliveryTimeLabel(rate)}`
  }

  const price = props.profile.rates.length > 1
    ? `From ${formatMinorCurrency(rate.one_item_fee_minor, props.profile.currency)}`
    : `${formatMinorCurrency(rate.one_item_fee_minor, props.profile.currency)} first · ${formatMinorCurrency(rate.additional_item_fee_minor, props.profile.currency)} additional`

  return `${price} · ${deliveryTimeLabel(rate)}`
})

/**
 * UPopover renders its trigger as a bare `div[role="button"]` with no tabindex,
 * which Tab skips. Headless UI already toggles it on Enter/Space, so making it
 * focusable is all a keyboard seller needs. A function ref re-applies this when
 * the rates change a profile's cell from empty to priced.
 */
function registerTrigger(element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) {
    element.parentElement?.setAttribute('tabindex', '0')
  }
}
</script>

<template>
  <span
    v-if="!profile.rates.length"
    class="text-sm text-text-muted"
  >-</span>

  <UPopover
    v-else-if="hasHiddenRates"
    :popper="{ placement: 'bottom-start' }"
    :ui="{ trigger: 'group block w-full cursor-pointer focus:outline-none' }"
  >
    <template #default="{ open }">
      <div
        :ref="registerTrigger"
        class="-mx-2 inline-flex max-w-full items-start gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-surface-hover"
        :class="open ? 'bg-surface-hover' : 'group-focus-visible:ring-2 group-focus-visible:ring-border-hover'"
      >
        <div class="space-y-0.5">
          <div class="text-sm font-medium text-text-strong">
            {{ destinations }}
            <span
              v-if="hiddenDestinationCount > 0"
              class="font-normal text-text-muted"
            >+{{ hiddenDestinationCount }} more</span>
          </div>
          <div class="text-sm text-text-muted">
            {{ rateSummary }}
          </div>
        </div>
        <AppIcon
          name="chevronDown"
          size="xs"
          class="mt-1 text-text-subtle transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
        <span class="sr-only">View all shipping rates</span>
      </div>
    </template>

    <template #panel>
      <div class="w-72 whitespace-normal p-3">
        <ul class="divide-y divide-border-subtle">
          <li
            v-for="rate in profile.rates"
            :key="rate.id"
            class="py-2.5 text-sm first:pt-0 last:pb-0"
          >
            <span class="block font-medium text-text-strong">{{ destinationLabel(rate) }}</span>
            <span class="block text-text-muted">{{ feeLabel(rate) }}</span>
            <span class="block text-text-muted">{{ deliveryTimeLabel(rate) }}</span>
          </li>
        </ul>
      </div>
    </template>
  </UPopover>

  <div
    v-else
    class="-mx-2 inline-flex max-w-full items-start px-2 py-1"
  >
    <div class="space-y-0.5">
      <div class="text-sm font-medium text-text-strong">
        {{ destinations }}
      </div>
      <div class="text-sm text-text-muted">
        {{ rateSummary }}
      </div>
    </div>
  </div>
</template>
