<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import { fieldRowUi } from '../../../shipping-profile-field-row'
import { useShippingProfilePreviewSection } from './use-shipping-profile-preview-section'
import type { ShippingProfileSelectOption } from '../../shipping-profile-editor.constants'

const props = defineProps<{
  countryOptions: ShippingProfileSelectOption[]
  profileId: string
}>()

const {
  canPreview,
  formatCalendarDay,
  isPreviewing,
  previewError,
  previewResult,
  previewState,
  readinessIssueLabels,
  runPreview,
} = useShippingProfilePreviewSection(props)
</script>

<template>
  <section class="space-y-4 rounded-lg border border-border-subtle p-4">
    <div>
      <h3 class="font-semibold text-text-strong">
        Preview a destination
      </h3>
      <p class="text-sm text-text-muted">
        The server applies destination precedence and calculates the total.
      </p>
    </div>
    <div class="space-y-4">
      <UFormGroup
        label="Country"
        required
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-[61%]')"
      >
        <USelectMenu
          v-model="previewState.country_code"
          searchable
          :options="countryOptions"
          value-attribute="value"
          option-attribute="label"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        label="Quantity"
        required
        class="flex w-full items-start gap-6"
        :ui="fieldRowUi('w-1/3')"
      >
        <UInput
          v-model.number="previewState.quantity"
          type="number"
          min="1"
          size="lg"
        />
      </UFormGroup>
    </div>
    <UButton
      type="button"
      color="gray"
      :loading="isPreviewing"
      :disabled="!canPreview"
      @click="runPreview"
    >
      Calculate preview
    </UButton>
    <UAlert
      v-if="previewError"
      color="red"
      variant="subtle"
      title="Preview failed"
      :description="previewError"
    />
    <UAlert
      v-else-if="previewResult && !previewResult.checkout_ready"
      color="yellow"
      variant="subtle"
      title="Profile is not checkout-ready"
      :description="readinessIssueLabels"
    />
    <UAlert
      v-else-if="previewResult && !previewResult.matched"
      color="yellow"
      variant="subtle"
      title="Unsupported destination"
      description="No configured rate matches this destination."
    />
    <div
      v-else-if="previewResult?.matched"
      class="rounded-md bg-surface-subtle p-4 text-sm"
    >
      <div class="font-medium">
        Matched {{ previewResult.rate?.destination_scope.replaceAll('_', ' ') }} rate
      </div>
      <div
        v-if="previewResult.processing_time"
        class="text-text-muted"
      >
        Processing {{ previewResult.processing_time.min_days }}–{{ previewResult.processing_time.max_days }} days
      </div>
      <div
        v-if="previewResult.delivery_time"
        class="text-text-muted"
      >
        Delivery {{ previewResult.delivery_time.min_days }}–{{ previewResult.delivery_time.max_days }} days
      </div>
      <div>First item: {{ formatMinorCurrency(previewResult.base_item_total_minor ?? 0, previewResult.currency ?? 'USD') }}</div>
      <div>Additional items: {{ previewResult.additional_items_quantity ?? 0 }} × {{ formatMinorCurrency(previewResult.rate?.additional_item_fee_minor ?? 0, previewResult.currency ?? 'USD') }} = {{ formatMinorCurrency(previewResult.additional_items_total_minor ?? 0, previewResult.currency ?? 'USD') }}</div>
      <div class="mt-1 font-semibold">
        Total: {{ formatMinorCurrency(previewResult.total_minor ?? 0, previewResult.currency ?? 'USD') }}
      </div>
      <div
        v-if="previewResult.estimate"
        class="mt-2 border-t border-border-subtle pt-2"
      >
        <div class="font-medium">
          Estimated delivery {{ previewResult.estimate.combined_min_days }}–{{ previewResult.estimate.combined_max_days }} days
        </div>
        <div class="text-text-muted">
          {{ formatCalendarDay(previewResult.estimate.earliest_delivery_date) }} – {{ formatCalendarDay(previewResult.estimate.latest_delivery_date) }}
        </div>
      </div>
      <div
        v-else
        class="mt-2 text-text-muted"
      >
        Add a complete Processing time and Delivery time range to see the estimate.
      </div>
    </div>
  </section>
</template>
