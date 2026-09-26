<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import ShippingProfileRateCard from './shipping-profile-rate-card.vue'
import { createEmptyShippingProfileRate } from '../shipping-profile-editor.mapper'
import type { ShippingProfileRateDraft } from '../shipping-profile-editor.mapper'
import type { ShippingProfileSelectOption } from '../shipping-profile-editor.constants'

defineProps<{
  countryOptions: ShippingProfileSelectOption[]
  currency: string
  destinationScopeOptions: ShippingProfileSelectOption[]
  daysRequired: boolean
}>()

const rates = defineModel<ShippingProfileRateDraft[]>({ required: true })

function addRate() {
  rates.value = [...rates.value, createEmptyShippingProfileRate()]
}

function removeRate(index: number) {
  rates.value = rates.value.filter((_, rateIndex) => rateIndex !== index)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="font-semibold text-text-strong">
          Destination rates
        </h3>
        <p class="text-sm text-text-muted">
          Country rates take precedence, then everywhere else.
        </p>
      </div>
      <UButton
        type="button"
        color="gray"
        :icon="ICON_NAME_BY_ALIAS.plus"
        @click="addRate"
      >
        Add rate
      </UButton>
    </div>

    <ShippingProfileRateCard
      v-for="(rate, index) in rates"
      :key="rate.localId"
      v-model="rates[index]"
      :index="index"
      :currency="currency"
      :country-options="countryOptions"
      :destination-scope-options="destinationScopeOptions"
      :removable="rates.length > 1"
      :days-required="daysRequired"
      @remove="removeRate(index)"
    />
  </div>
</template>
