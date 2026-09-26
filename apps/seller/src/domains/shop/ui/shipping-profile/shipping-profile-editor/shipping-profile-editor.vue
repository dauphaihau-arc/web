<script setup lang="ts">
import { SHIPPING_PROFILE_CONFIG, ShippingProfileStatuses } from '@arc/enums/shipping'
import { fieldRowUi } from '../shipping-profile-field-row'
import { shippingProfileFormSchema } from '../shipping-profile-form.schema'
import { destinationScopeOptions, statusOptions } from './shipping-profile-editor.constants'
import { useShippingProfileEditor } from './use-shipping-profile-editor'
import ShippingDaysInput from '../shipping-days-input.vue'
import ShippingProfilePreviewSection from './_components/shipping-profile-preview-section/shipping-profile-preview-section.vue'
import ShippingProfileRatesSection from './_components/shipping-profile-rates-section.vue'
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'

const props = defineProps<{
  profile?: ShippingProfileResource
  shopCurrency?: string
}>()

const emit = defineEmits<{
  saved: [profile: ShippingProfileResource]
  cancelled: []
}>()

const {
  activeWarning,
  countryOptions,
  hasSubmitted,
  isSubmitting,
  onValidationError,
  processingRangeError,
  profileCurrency,
  readinessIssues,
  serverError,
  staleWriteError,
  state,
  submitProfile,
} = useShippingProfileEditor(props, emit)

/** Processing and Delivery ranges are only required to activate a profile. */
const daysRequired = computed(() => state.status === ShippingProfileStatuses.ACTIVE)

const modal = useModal()
const formRef = ref()

function cancel() {
  emit('cancelled')
  modal.close()
}

function submit() {
  formRef.value?.submit()
}

defineExpose({ submit, cancel, isSubmitting })
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="activeWarning"
      color="yellow"
      variant="subtle"
      :title="activeWarning"
    />
    <UAlert
      v-if="staleWriteError"
      color="yellow"
      variant="subtle"
      title="Profile changed"
      :description="staleWriteError"
    />
    <UAlert
      v-if="serverError"
      color="red"
      variant="subtle"
      title="Unable to save"
      :description="serverError"
    />

    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :state="state"
      :schema="shippingProfileFormSchema"
      class="space-y-5"
      @error="onValidationError"
      @submit="submitProfile"
    >
      <div class="space-y-6">
        <UFormGroup
          label="Profile name"
          name="name"
          required
          class="flex w-full items-start gap-6"
          :ui="fieldRowUi('w-[61%]')"
        >
          <UInput
            v-model.trim="state.name"
            :maxlength="SHIPPING_PROFILE_CONFIG.MAX_NAME_CHAR"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          label="Status"
          name="status"
          required
          class="flex w-full items-start gap-6"
          :ui="fieldRowUi('w-1/3')"
        >
          <USelectMenu
            v-model="state.status"
            :options="statusOptions"
            value-attribute="value"
            option-attribute="label"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          label="Ship-from country"
          name="ship_from_country"
          class="flex w-full items-start gap-6"
          :ui="fieldRowUi('w-[61%]')"
        >
          <USelectMenu
            v-model="state.ship_from_country"
            searchable
            clear-search-on-close
            :options="countryOptions"
            value-attribute="value"
            option-attribute="label"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          label="Ship-from postal code"
          name="ship_from_postal"
          class="flex w-full items-start gap-6"
          :ui="fieldRowUi('w-1/4')"
        >
          <UInput
            v-model.trim="state.ship_from_postal"
            v-uppercase
            :maxlength="SHIPPING_PROFILE_CONFIG.MAX_POSTAL_CHAR"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          label="Processing time (calendar days)"
          name="processing_time_min_days"
          :required="daysRequired"
          :error="hasSubmitted ? processingRangeError : undefined"
          description="Elapsed days before you dispatch."
          class="flex w-full items-start gap-6"
          :ui="fieldRowUi('w-[61%]')"
        >
          <div class="flex items-center gap-2">
            <ShippingDaysInput
              id="processing_time_min_days"
              v-model="state.processing_time_min_days"
              label="Minimum processing days"
              class="w-20"
            />
            <span class="text-sm text-text-muted">to</span>
            <ShippingDaysInput
              id="processing_time_max_days"
              v-model="state.processing_time_max_days"
              label="Maximum processing days"
              class="w-20"
            />
            <span class="text-sm text-text-muted">days</span>
          </div>
        </UFormGroup>
      </div>

      <UAlert
        v-if="readinessIssues.length"
        color="yellow"
        variant="subtle"
        title="Resolve these before activating"
      >
        <template #description>
          <ul class="list-disc space-y-1 pl-5">
            <li
              v-for="issue in readinessIssues"
              :key="issue"
            >
              {{ issue }}
            </li>
          </ul>
        </template>
      </UAlert>

      <ShippingProfileRatesSection
        v-model="state.rates"
        :currency="profileCurrency"
        :country-options="countryOptions"
        :destination-scope-options="destinationScopeOptions"
        :days-required="daysRequired"
      />

      <ShippingProfilePreviewSection
        v-if="profile"
        :profile-id="profile.id"
        :country-options="countryOptions"
      />
    </UForm>
  </div>
</template>
