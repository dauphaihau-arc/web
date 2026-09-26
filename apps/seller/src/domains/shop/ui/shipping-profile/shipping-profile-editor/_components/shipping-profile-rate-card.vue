<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { SHIPPING_PROFILE_CONFIG, ShippingDestinationScopes } from '@arc/enums/shipping'
import { fromMinorUnits } from '@arc/utils'
import { fieldRowUi } from '../../shipping-profile-field-row'
import ShippingDaysInput from '../../shipping-days-input.vue'
import type { ShippingProfileRateDraft } from '../shipping-profile-editor.mapper'
import type { ShippingProfileSelectOption } from '../shipping-profile-editor.constants'

const props = defineProps<{
  countryOptions: ShippingProfileSelectOption[]
  currency: string
  destinationScopeOptions: ShippingProfileSelectOption[]
  daysRequired: boolean
  index: number
  removable: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const rate = defineModel<ShippingProfileRateDraft>({ required: true })

/** The shared fee ceiling is a minor-unit cap; the field edits major units. */
const maxFee = computed(() => fromMinorUnits(SHIPPING_PROFILE_CONFIG.MAX_FEE_MINOR, props.currency))
</script>

<template>
  <div class="rounded-lg border border-border-subtle p-4">
    <div class="mb-4 flex items-center justify-between">
      <span class="font-medium">Rate {{ index + 1 }}</span>
      <UButton
        type="button"
        color="gray"
        variant="ghost"
        :icon="ICON_NAME_BY_ALIAS.trash"
        :disabled="!removable"
        @click="emit('remove')"
      />
    </div>
    <div class="space-y-4">
      <UFormGroup
        label="Destination scope"
        :name="`rates.${index}.destination_scope`"
        required
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-[61%]')"
      >
        <USelectMenu
          v-model="rate.destination_scope"
          :options="destinationScopeOptions"
          value-attribute="value"
          option-attribute="label"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        v-if="rate.destination_scope !== ShippingDestinationScopes.EVERYWHERE_ELSE"
        label="Country"
        :name="`rates.${index}.destination_country`"
        required
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-[61%]')"
      >
        <USelectMenu
          v-model="rate.destination_country"
          searchable
          :options="countryOptions"
          value-attribute="value"
          option-attribute="label"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        label="One item fee"
        :name="`rates.${index}.one_item_fee`"
        required
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-1/4')"
      >
        <UInput
          v-model.number="rate.one_item_fee"
          v-numeric
          v-max-number="maxFee"
          type="number"
          min="0"
          step="0.01"
          size="lg"
        >
          <template #trailing>
            {{ currency }}
          </template>
        </UInput>
      </UFormGroup>
      <UFormGroup
        label="Each additional item"
        :name="`rates.${index}.additional_item_fee`"
        required
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-1/4')"
      >
        <UInput
          v-model.number="rate.additional_item_fee"
          v-numeric
          v-max-number="maxFee"
          type="number"
          min="0"
          step="0.01"
          size="lg"
        >
          <template #trailing>
            {{ currency }}
          </template>
        </UInput>
      </UFormGroup>
      <UFormGroup
        label="Delivery time (calendar days)"
        :name="`rates.${index}.delivery_time_min_days`"
        :required="daysRequired"
        description="Elapsed days in transit after dispatch."
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-[61%]')"
      >
        <div class="flex items-center gap-2">
          <ShippingDaysInput
            :id="`rates.${index}.delivery_time_min_days`"
            v-model="rate.delivery_time_min_days"
            :label="`Minimum delivery days for rate ${index + 1}`"
            class="w-20"
          />
          <span class="text-sm text-text-muted">to</span>
          <ShippingDaysInput
            :id="`rates.${index}.delivery_time_max_days`"
            v-model="rate.delivery_time_max_days"
            :label="`Maximum delivery days for rate ${index + 1}`"
            class="w-20"
          />
          <span class="text-sm text-text-muted">days</span>
        </div>
      </UFormGroup>
    </div>
  </div>
</template>
