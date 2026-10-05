<script setup lang="ts">
import PromotionProductsCard from '~/domains/shop/ui/promotion/promotion-products-card.vue'
import PromotionScheduleCard from '~/domains/shop/ui/promotion/promotion-schedule-card.vue'
import FixedFormActions from '~/shared/ui/fixed-form-actions.vue'
import SaleDetailsCard from './sale-details-card.vue'
import SalePreviewCard from './sale-preview-card.vue'
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
      <SaleDetailsCard
        v-model:name="state.name"
        v-model:percent-off="state.percent_off"
        :disabled="isPendingCreateSale"
      />

      <PromotionProductsCard
        v-model:product-scope="state.product_scope"
        v-model:product-ids="state.product_ids"
        question="Which products are included in your sale?"
        :disabled="isPendingCreateSale"
      />

      <PromotionScheduleCard
        v-model:start-mode="state.start_mode"
        v-model:start-local="state.start_local"
        v-model:end-local="state.end_local"
        v-model:start-occurrence="state.start_occurrence"
        v-model:end-occurrence="state.end_occurrence"
        v-model:timezone="timezone"
        subject="sale"
        :disabled="isPendingCreateSale"
        :start-is-ambiguous="startIsAmbiguous"
        :end-is-ambiguous="endIsAmbiguous"
        :timezone-options="timezoneOptions"
        :store-timezone="storeTimezone"
        :is-store-timezone="isStoreTimezone"
        :is-picker-open="isPickerOpen"
        :change-timezone="changeTimezone"
      />

      <SalePreviewCard
        :percent-off="state.percent_off"
        :product-scope="state.product_scope"
        :product-ids="state.product_ids"
      />
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
