<script setup lang="ts">
import { PromotionProductScope } from '@arc/enums/promotion'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import ApplyProductTargets from '~/domains/shop/ui/apply-product-targets.vue'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import FixedFormActions from '~/shared/ui/fixed-form-actions.vue'
import SaleScheduleOccurrenceField from '~/app/pages/sales/new/_components/sale-schedule-occurrence-field.vue'
import {
  PROMO_CODE_PRODUCT_SCOPE_OPTIONS,
  PROMO_CODE_VISIBILITY_OPTIONS,
  PROMO_CODE_START_MODE_OPTIONS,
  PROMO_CODE_CODE_MAX_LENGTH,
} from './create-promo-code-form.constants'
import { CREATE_PROMO_CODE_FORM_ID, useCreatePromoCodeForm } from './use-create-promo-code-form'

const {
  formRef,
  codeFieldRef,
  state,
  validate,
  onSubmit,
  onError,
  cancel,
  isPendingCreatePromoCode,
  startIsAmbiguous,
  endIsAmbiguous,
  changeTimezone,
  timezone,
  timezoneOptions,
  storeTimezone,
  isPickerOpen,
  isStoreTimezone,
} = useCreatePromoCodeForm()
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
      <WrapperFormGroupCard>
        <template #title>
          Promo code details
        </template>
        <template #content>
          <div class="space-y-5">
            <UFormGroup
              label="Name"
              name="name"
              description="Buyers won’t see this. It is only for you to track the promo code, and does not need to be unique."
              class="grid grid-cols-4 gap-10"
              required
            >
              <UInput
                v-model="state.name"
                placeholder="Ex. Autumn promo code"
                :disabled="isPendingCreatePromoCode"
                :maxlength="255"
                size="lg"
              />
            </UFormGroup>

            <UFormGroup
              ref="codeFieldRef"
              label="Code"
              name="code"
              description="This is what shoppers will enter at checkout to get a discount. Letters and numbers only."
              class="grid grid-cols-4 gap-10"
              required
            >
              <UInput
                v-model="state.code"
                v-uppercase
                :maxlength="PROMO_CODE_CODE_MAX_LENGTH"
                :disabled="isPendingCreatePromoCode"
                placeholder="Ex. WINTERSALE"
                size="lg"
                class="w-full"
                @keydown.space.prevent
              />
            </UFormGroup>

            <UFormGroup
              label="Percentage off"
              name="percent_off"
              description="Every eligible product’s current regular price is reduced by this percentage at checkout."
              class="grid grid-cols-4 items-center gap-10"
              required
            >
              <UInput
                v-model.number="state.percent_off"
                v-numeric
                v-max-number="99"
                :disabled="isPendingCreatePromoCode"
                type="number"
                size="lg"
                class="w-32"
              >
                <template #trailing>
                  <span class="text-xs text-text-muted">%</span>
                </template>
              </UInput>
            </UFormGroup>

            <UFormGroup
              label="Visibility"
              name="visibility"
              description="Public promo codes can appear in checkout for eligible shoppers. Code-only promo codes are applied only when a shopper enters the code."
              class="grid grid-cols-4 gap-10"
              required
            >
              <RadioGroupInput
                v-model="state.visibility"
                :options="PROMO_CODE_VISIBILITY_OPTIONS"
                :disabled="isPendingCreatePromoCode"
                row
              />
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
              label="Which products are eligible for this promo code?"
              name="product_scope"
              description="Selecting a product includes every one of its purchasable variants."
            >
              <RadioGroupInput
                v-model="state.product_scope"
                :options="PROMO_CODE_PRODUCT_SCOPE_OPTIONS"
                :disabled="isPendingCreatePromoCode"
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
              label="When should the promo code start?"
              name="start_mode"
            >
              <RadioGroupInput
                v-model="state.start_mode"
                :options="PROMO_CODE_START_MODE_OPTIONS"
                :disabled="isPendingCreatePromoCode"
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
              description="The promo code is active up to, but not including, this local time."
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
                  Custom for this promo code
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
                Scheduled in your store timezone. It is saved with this promo code, so travelling
                does not reinterpret the schedule.
              </p>
              <p
                v-else-if="state.timezone"
                class="mt-1 text-sm text-text-muted"
              >
                Saved with this promo code only. Your store timezone is {{ storeTimezone }}.
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
