<script setup lang="ts">
import { PromotionProductScope } from '@arc/enums/promotion'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import ApplyProductTargets from '~/domains/shop/ui/apply-product-targets.vue'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import FixedFormActions from '~/shared/ui/fixed-form-actions.vue'
import SalePricePreview from './sale-price-preview.vue'
import SaleScheduleOccurrenceField from './sale-schedule-occurrence-field.vue'
import {
  SALE_PRODUCT_SCOPE_OPTIONS,
  SALE_START_MODE_OPTIONS,
} from './create-sale-form.constants'
import { CREATE_SALE_FORM_ID, useCreateSaleForm } from './use-create-sale-form'

const {
  state,
  validate,
  onSubmit,
  onError,
  cancel,
  submitLabel,
  isPendingCreateSale,
  startIsAmbiguous,
  endIsAmbiguous,
  changeTimezone,
  timezone,
  timezoneOptions,
  storeTimezone,
  isPickerOpen,
  isStoreTimezone,
} = useCreateSaleForm()
</script>

<template>
  <div>
    <UForm
      :id="CREATE_SALE_FORM_ID"
      :validate-on="['submit']"
      :validate="validate"
      :state="state"
      class="space-y-7"
      @error="onError"
      @submit="onSubmit"
    >
      <WrapperFormGroupCard>
        <template #title>
          Sale details
        </template>
        <template #content>
          <div class="space-y-5">
            <UFormGroup
              label="Sale name"
              name="name"
              description="Buyers won’t see this. It is only for you to track the sale, and does not need to be unique."
              class="grid grid-cols-4 gap-10"
              required
            >
              <UInput
                v-model="state.name"
                placeholder="Ex. Autumn sale"
                :disabled="isPendingCreateSale"
                :maxlength="255"
                size="lg"
              />
            </UFormGroup>

            <UFormGroup
              label="Percentage off"
              name="percent_off"
              description="Every eligible product’s current regular price is reduced by this percentage."
              class="grid grid-cols-4 items-center gap-10"
              required
            >
              <UInput
                v-model.number="state.percent_off"
                v-numeric
                v-max-number="99"
                :disabled="isPendingCreateSale"
                type="number"
                size="lg"
                class="w-32"
              >
                <template #trailing>
                  <span class="text-xs text-text-muted">%</span>
                </template>
              </UInput>
            </UFormGroup>
          </div>
        </template>
      </WrapperFormGroupCard>

      <WrapperFormGroupCard>
        <template #title>
          Products
        </template>
        <template #content>
          <div class="space-y-5">
            <UFormGroup
              label="Which products are included in your sale?"
              name="product_scope"
              description="Selecting a product includes every one of its purchasable variants."
            >
              <RadioGroupInput
                v-model="state.product_scope"
                :options="SALE_PRODUCT_SCOPE_OPTIONS"
                :disabled="isPendingCreateSale"
                row
              />
            </UFormGroup>

            <UFormGroup
              v-if="state.product_scope === PromotionProductScope.SPECIFIC"
              name="product_ids"
            >
              <ApplyProductTargets v-model="state.product_ids" />
            </UFormGroup>
          </div>
        </template>
      </WrapperFormGroupCard>

      <WrapperFormGroupCard>
        <template #title>
          Schedule
        </template>
        <template #content>
          <div class="space-y-5">
            <UFormGroup
              label="When should the sale start?"
              name="start_mode"
            >
              <RadioGroupInput
                v-model="state.start_mode"
                :options="SALE_START_MODE_OPTIONS"
                :disabled="isPendingCreateSale"
                row
              />
            </UFormGroup>

            <UFormGroup
              v-if="state.start_mode === 'scheduled'"
              label="Start"
              name="start_local"
              required
            >
              <UInput
                v-model="state.start_local"
                type="datetime-local"
                size="lg"
                class="w-64"
              />
              <SaleScheduleOccurrenceField
                v-if="startIsAmbiguous"
                v-model="state.start_occurrence"
                label="Start occurrence"
              />
            </UFormGroup>

            <UFormGroup
              label="End"
              name="end_local"
              description="The sale is active up to, but not including, this local time."
              required
            >
              <UInput
                v-model="state.end_local"
                type="datetime-local"
                size="lg"
                class="w-64"
              />
              <SaleScheduleOccurrenceField
                v-if="endIsAmbiguous"
                v-model="state.end_occurrence"
                label="End occurrence"
              />
            </UFormGroup>

            <UFormGroup
              label="Timezone"
              name="timezone"
              required
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm">
                  {{ state.timezone || 'Loading store timezone…' }}
                </span>
                <UBadge
                  v-if="isStoreTimezone"
                  color="gray"
                  variant="soft"
                  size="xs"
                >
                  Store default
                </UBadge>
                <UBadge
                  v-else-if="state.timezone"
                  color="primary"
                  variant="soft"
                  size="xs"
                >
                  Custom for this sale
                </UBadge>
                <UButton
                  v-if="!isPickerOpen"
                  color="gray"
                  variant="link"
                  size="xs"
                  @click="changeTimezone"
                >
                  Change timezone
                </UButton>
              </div>
              <p
                v-if="isStoreTimezone"
                class="mt-1 text-sm text-text-muted"
              >
                Scheduled in your store timezone. It is saved with this sale, so travelling does
                not reinterpret the schedule.
              </p>
              <p
                v-else-if="state.timezone"
                class="mt-1 text-sm text-text-muted"
              >
                Saved with this sale only. Your store timezone is {{ storeTimezone }}.
              </p>
              <USelectMenu
                v-if="isPickerOpen"
                v-model="timezone"
                :options="timezoneOptions"
                searchable
                size="lg"
                class="mt-2 w-96"
              />
            </UFormGroup>
          </div>
        </template>
      </WrapperFormGroupCard>

      <WrapperFormGroupCard>
        <template #title>
          Preview
        </template>
        <template #subtitle>
          Illustrative regular and sale prices for this percentage. Checkout promo codes are
          excluded, and a better overlapping sale would take precedence over this one.
        </template>
        <template #content>
          <SalePricePreview
            :percent-off="state.percent_off"
            :product-scope="state.product_scope"
            :product-ids="state.product_ids"
          />
        </template>
      </WrapperFormGroupCard>
    </UForm>

    <FixedFormActions>
      <UButton
        :disabled="isPendingCreateSale"
        size="sm"
        color="gray"
        @click="cancel"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        :form="CREATE_SALE_FORM_ID"
        :loading="isPendingCreateSale"
        size="sm"
      >
        {{ submitLabel }}
      </UButton>
    </FixedFormActions>
  </div>
</template>
