<script setup lang="ts">
import {
  CouponAppliesTo, COUPON_CONFIG, CouponMinOrderTypes, CouponTypes,
} from '@arc/enums/coupon'
import type { RequiredFields } from '@arc/contracts/utils'
import RadioGroupInput from '@arc/ui/radio-group-input.vue'
import { createSaleFormSchema } from '~/shared/schemas/forms/shop/coupon/create-sale-form.schema'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { ROUTES } from '~/shared/config/enums/routes'
import WrapperFormGroupCard from '~/app/components/account/shop/wrapper-form-group-card.vue'
import ApplyCouponOnProduct from '~/app/components/account/shop/coupons/apply-coupon-on-product.vue'
import SearchStartEndDateInput from '~/app/components/account/shop/coupons/search-start-end-date-input.vue'
import { useShopCreateCoupon } from '~/shared/server-state/shop/coupon/create-coupon.mutation'
import { toastCustom } from '~/shared/config/toast'
import type { CreateSaleBody } from '~/shared/api/shop/coupon/contracts/coupon.contract'

const router = useRouter()
const toast = useToast()

const {
  mutateAsync: runSale,
  isPending: isPendingRunSale,
} = useShopCreateCoupon()

type StateSubmit = RequiredFields<Partial<CreateSaleBody>, 'type' | 'applies_to' | 'min_order_type' | 'is_auto_sale'>

const couponTypeOptions = [
  {
    value: CouponTypes.PERCENTAGE,
    label: 'Percentage off',
  },
  {
    value: CouponTypes.FREE_SHIP,
    label: 'Free standard shipping',
  },
]

const couponMinOrderOptions = [
  { value: CouponMinOrderTypes.NONE, label: 'none' },
  { value: CouponMinOrderTypes.NUMBER_OF_PRODUCTS, label: 'Number of items' },
  { value: CouponMinOrderTypes.ORDER_TOTAL, label: 'Order total' },
]

const couponAppliesToOptions = [
  { value: CouponAppliesTo.ALL, label: 'All products' },
  { value: CouponAppliesTo.SPECIFIC, label: 'Select products' },
]

const state = reactive<StateSubmit>({
  type: CouponTypes.PERCENTAGE,
  min_order_type: CouponMinOrderTypes.NONE,
  applies_to: CouponAppliesTo.ALL,
  is_auto_sale: true,
})

const formRef = ref()
const btnSubmit = ref()

const validate = (stateValidate: CreateSaleBody): FormError[] => {
  let errors: FormError[] = []

  const result = createSaleFormSchema.safeParse(stateValidate)

  if (!result.success) {
    errors = result.error.issues.map((detail) => {
      const path = detail.path.at(-1)
      return {
        path: typeof path === 'string' ? path : '',
        message: detail.message,
      }
    })
    log.error('zod parse errors', errors)
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<CreateSaleBody>) {
  formRef.value.clear()

  try {
    await runSale(event.data)
    await router.push(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.COUPONS}`)
    toast.add({
      ...toastCustom.success,
      title: 'Run sale success',
    })
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Run sale failed',
    })
  }
}

function onError(event: FormErrorEvent) {
  const element = document.getElementById(event.errors[0].id)
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <UForm
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
        Basic info
      </template>
      <template #content>
        <div class="space-y-5">
          <UFormGroup
            label="Sale name"
            name="code"
            description="Buyers won’t see this - it’s just for you to track the sale’s performance.
             Each name should be unique, and only use letters and numbers."
            class="grid grid-cols-4 gap-10"
            required
          >
            <UInput
              v-model="state.code"
              v-uppercase
              placeholder="Ex. SALE11"
              :disabled="isPendingRunSale"
              :maxlength="COUPON_CONFIG.MAX_CHAR_CODE"
              size="lg"
              @keydown.space.prevent
            />
          </UFormGroup>

          <UFormGroup
            label="Sale duration"
            name="duration"
            class="grid grid-cols-4 gap-10"
            required
            description="Sales can be set to run up to 30 days."
          >
            <SearchStartEndDateInput
              v-model:start-date="state.start_date"
              v-model:end-date="state.end_date"
            />
          </UFormGroup>
        </div>
      </template>
    </WrapperFormGroupCard>

    <WrapperFormGroupCard>
      <template #title>
        Details
      </template>
      <template #content>
        <div class="space-y-8">
          <UFormGroup
            label="Discount type"
            name="type"
            class="grid grid-cols-4 items-center gap-10"
          >
            <div class="flex space-x-5">
              <USelectMenu
                v-model="state.type"
                size="lg"
                :options="couponTypeOptions"
                value-attribute="value"
                name-attribute="label"
              />
              <UFormGroup
                v-if="state.type === CouponTypes.PERCENTAGE"
                name="percent_off"
                class="w-1/2"
              >
                <UInput
                  v-model.number="state.percent_off"
                  v-numeric
                  v-max-number="COUPON_CONFIG.MAX_PERCENTAGE_OFF"
                  size="lg"
                  class="w-20"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-500 dark:text-gray-400">%</span>
                  </template>
                </UInput>
              </UFormGroup>
            </div>
          </UFormGroup>

          <UFormGroup
            label="Order minimum"
            description="You can require a minimum spend or number of items for buyers to qualify for your offer."
            name="min_order_type"
            class="grid grid-cols-4 items-center gap-10"
            :ui="{ container: 'col-span-2' }"
          >
            <div class="flex space-x-5">
              <USelectMenu
                v-model="state.min_order_type"
                size="lg"
                :options="couponMinOrderOptions"
                class="w-[180px]"
                value-attribute="value"
                name-attribute="label"
              />

              <UFormGroup
                v-if="state.min_order_type === CouponMinOrderTypes.NUMBER_OF_PRODUCTS"
                name="min_products"
                class="w-1/3"
              >
                <UInput
                  v-model.number="state.min_products"
                  v-numeric
                  size="lg"
                />
              </UFormGroup>
              <UFormGroup
                v-if="state.min_order_type === CouponMinOrderTypes.ORDER_TOTAL"
                name="min_order_value"
                class="w-1/3"
              >
                <UInput
                  v-model.number="state.min_order_value"
                  v-numeric
                  size="lg"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-500 dark:text-gray-400">USD</span>
                  </template>
                </UInput>
              </UFormGroup>
            </div>
          </UFormGroup>

          <UFormGroup
            label="Maximum total usage"
            name="max_uses"
            class="grid grid-cols-4 items-center gap-10"
          >
            <UInput
              v-model.number="state.max_uses"
              v-max-number="COUPON_CONFIG.MAX_USES"
              v-numeric
              :disabled="isPendingRunSale"
              size="lg"
              class="w-1/2"
              @keydown.space.prevent
            />
          </UFormGroup>

          <UFormGroup
            label="Maximum Usage/Buyer"
            name="max_uses_per_user"
            class="grid grid-cols-4 items-center gap-10"
          >
            <UInput
              v-model.number="state.max_uses_per_user"
              v-max-number="COUPON_CONFIG.MAX_USES_PER_USER"
              v-numeric
              type="number"
              :disabled="isPendingRunSale"
              size="lg"
              class="w-1/2"
              @keydown.space.prevent
            />
          </UFormGroup>

          <UFormGroup
            class="mb-4"
            label="Which products are included in your sale?"
            description="Your discount can apply shop-wide, or be limited to specific items."
            name="applies_to"
          >
            <RadioGroupInput
              v-model="state.applies_to"
              :options="couponAppliesToOptions"
              :disabled="isPendingRunSale"
              row
            />
          </UFormGroup>

          <div v-if="state.applies_to === CouponAppliesTo.SPECIFIC">
            <ApplyCouponOnProduct v-model="state.applies_product_ids" />
            <div
              v-if="formRef.getErrors('applies_product_ids')[0]?.message"
              class="mt-2 text-red-500"
            >
              {{ formRef.getErrors('applies_product_ids')[0].message }}
            </div>
          </div>
        </div>
      </template>
    </WrapperFormGroupCard>

    <button
      ref="btnSubmit"
      type="submit"
      class="hidden"
    />
  </UForm>

  <div
    class="fixed bottom-0 left-0 flex
       w-full items-center justify-end gap-2 border-t bg-white py-2.5 pr-8"
  >
    <UButton
      :disabled="isPendingRunSale"
      size="sm"
      type="submit"
      color="gray"
      @click="router.push(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.COUPONS}`)"
    >
      Cancel
    </UButton>
    <UButton
      :loading="isPendingRunSale"
      size="sm"
      type="submit"
      @click="() => btnSubmit.click()"
    >
      Create
    </UButton>
  </div>
</template>
