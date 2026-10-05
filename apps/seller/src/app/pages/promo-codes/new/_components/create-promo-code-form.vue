<script setup lang="ts">
import { ref } from 'vue'
import { PromotionBenefitType } from '@arc/enums/promotion'
import PromotionProductsCard from '~/domains/shop/ui/promotion/promotion-products-card.vue'
import PromotionScheduleCard from '~/domains/shop/ui/promotion/promotion-schedule-card.vue'
import FixedFormActions from '~/shared/ui/fixed-form-actions.vue'
import PromoCodeDetailsCard from './promo-code-details-card.vue'
import PromoCodeMinimumRequirementsCard from './promo-code-minimum-requirements-card.vue'
import PromoCodeRedemptionLimitsCard from './promo-code-redemption-limits-card.vue'
import { CREATE_PROMO_CODE_FORM_ID, useCreatePromoCodeForm } from './use-create-promo-code-form'

const detailsCardRef = ref<{ codeElement: () => HTMLElement | null } | null>(null)

const {
  formRef,
  state,
  validate,
  onSubmit,
  onError,
  cancel,
  isPendingCreatePromoCode,
  shopCurrency,
  startIsAmbiguous,
  endIsAmbiguous,
  changeTimezone,
  timezone,
  timezoneOptions,
  storeTimezone,
  isPickerOpen,
  isStoreTimezone,
} = useCreatePromoCodeForm({
  getCodeElement: () => detailsCardRef.value?.codeElement() ?? null,
})
</script>

<template>
  <div>
    <UForm
      :id="CREATE_PROMO_CODE_FORM_ID"
      ref="formRef"
      :validate-on="['submit']"
      :validate="validate"
      :state="state"
      class="space-y-7"
      @error="onError"
      @submit="onSubmit"
    >
      <PromoCodeDetailsCard
        ref="detailsCardRef"
        v-model:name="state.name"
        v-model:code="state.code"
        v-model:benefit-type="state.benefit_type"
        v-model:percent-off="state.percent_off"
        v-model:amount-off="state.amount_off"
        v-model:visibility="state.visibility"
        :disabled="isPendingCreatePromoCode"
        :shop-currency="shopCurrency"
      />

      <PromoCodeMinimumRequirementsCard
        v-model:min-order-type="state.min_order_type"
        v-model:min-order-value="state.min_order_value"
        v-model:min-purchase-quantity="state.min_purchase_quantity"
        :disabled="isPendingCreatePromoCode"
        :shop-currency="shopCurrency"
      />

      <PromotionProductsCard
        v-if="state.benefit_type !== PromotionBenefitType.FREE_SHIPPING"
        v-model:product-scope="state.product_scope"
        v-model:product-ids="state.product_ids"
        question="Which products are eligible for this promo code?"
        :disabled="isPendingCreatePromoCode"
      />

      <PromoCodeRedemptionLimitsCard
        v-model:max-redemptions="state.max_redemptions"
        v-model:max-redemptions-per-buyer="state.max_redemptions_per_buyer"
        :disabled="isPendingCreatePromoCode"
      />

      <PromotionScheduleCard
        v-model:start-mode="state.start_mode"
        v-model:start-local="state.start_local"
        v-model:end-local="state.end_local"
        v-model:start-occurrence="state.start_occurrence"
        v-model:end-occurrence="state.end_occurrence"
        v-model:timezone="timezone"
        subject="promo code"
        :disabled="isPendingCreatePromoCode"
        :start-is-ambiguous="startIsAmbiguous"
        :end-is-ambiguous="endIsAmbiguous"
        :timezone-options="timezoneOptions"
        :store-timezone="storeTimezone"
        :is-store-timezone="isStoreTimezone"
        :is-picker-open="isPickerOpen"
        :change-timezone="changeTimezone"
      />
    </UForm>

    <FixedFormActions>
      <UButton
        :disabled="isPendingCreatePromoCode"
        size="sm"
        color="gray"
        @click="cancel"
      >
        Cancel
      </UButton>
      <UButton
        type="submit"
        :form="CREATE_PROMO_CODE_FORM_ID"
        :loading="isPendingCreatePromoCode"
        size="sm"
      >
        Create promo code
      </UButton>
    </FixedFormActions>
  </div>
</template>
