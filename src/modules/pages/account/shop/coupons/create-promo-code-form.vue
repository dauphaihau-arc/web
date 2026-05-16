<script setup lang="ts">
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import {
  CouponAppliesTo, COUPON_CONFIG, CouponMinOrderTypes, CouponTypes,
} from '~/shared/config/enums/coupon'
import type { RequiredFields } from '~/shared/types/utils'
import { ROUTES } from '~/shared/config/enums/routes'
import { toastCustom } from '~/shared/config/toast'
import { useShopCreateCoupon } from '~/shared/server-state/shop'
import { PRODUCT_CONFIG } from '~/shared/config/enums/product'
import { createPromoCodeBodySchema } from '~/shared/schemas/request/shop-coupon.schema'
import type { CreatePromoCodeBody } from '~/shared/types/coupon'

type StateSubmit = RequiredFields<Partial<CreatePromoCodeBody>, 'type' | 'applies_to' | 'min_order_type'>

const router = useRouter()
const toast = useToast()

const {
  mutateAsync: createCoupon,
  isPending: isPendingCreateCoupon,
} = useShopCreateCoupon()

const couponTypeOptions = [
  { value: CouponTypes.PERCENTAGE, label: 'Percentage off' },
  { value: CouponTypes.FIXED_AMOUNT, label: 'Fixed amount off' },
  { value: CouponTypes.FREE_SHIP, label: 'Free standard shipping' },
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
})

const formRef = ref()
const btnSubmit = ref()

const validateForm = (stateValidate: CreatePromoCodeBody): FormError[] => {
  let errors: FormError[] = []

  const result = createPromoCodeBodySchema.safeParse(stateValidate)

  if (!result.success) {
    errors = result.error.issues.map((detail) => {
      const path = detail.path.at(-1)
      if (path === 'start_date' || path === 'end_date') {
        log.error(`${path} is invalid: `, stateValidate[path])
        return {
          path: 'duration',
          message: 'Invalid date',
        }
      }
      return {
        path: typeof path === 'string' ? path : '',
        message: detail.message,
      }
    })
    log.error('zod parse errors', errors)
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<CreatePromoCodeBody>) {
  formRef.value.clear()

  try {
    await createCoupon(event.data)
    await router.push(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.COUPONS}`)
    toast.add({
      ...toastCustom.success,
      title: 'Create promo code success',
    })
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Create promo code failed',
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
    :validate="validateForm"
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
            label="Code"
            name="code"
            description="This is what shoppers will enter at checkout to get a discount.
            Each code should be unique, and only use letters and numbers."
            class="grid grid-cols-4 gap-10"
            required
          >
            <UInput
              v-model="state.code"
              v-uppercase
              :maxlength="COUPON_CONFIG.MAX_CHAR_CODE"
              :disabled="isPendingCreateCoupon"
              placeholder="Ex. WINTERSALE"
              size="lg"
              class="w-full"
              @keydown.space.prevent
            />
          </UFormGroup>

          <UFormGroup
            label="Duration"
            name="duration"
            class="grid grid-cols-4 gap-10"
            required
            description="You can set a date for your code to expire, or leave it open-ended."
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
            :ui="{ container: 'col-span-2' }"
          >
            <div class="flex space-x-5">
              <USelectMenu
                v-model="state.type"
                size="lg"
                :options="couponTypeOptions"
                value-attribute="value"
                name-attribute="label"
                class="w-[220px]"
              />
              <UFormGroup
                v-if="state.type === CouponTypes.FIXED_AMOUNT"
                name="amount_off"
              >
                <UInput
                  v-model.number="state.amount_off"
                  v-max-number="PRODUCT_CONFIG.MAX_PRICE - 1"
                  v-numeric
                  size="lg"
                  class="w-1/2"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-500 dark:text-gray-400">USD</span>
                  </template>
                </UInput>
              </UFormGroup>
              <UFormGroup
                v-if="state.type === CouponTypes.PERCENTAGE"
                name="percent_off"
                class="w-2/5"
              >
                <UInput
                  v-model.number="state.percent_off"
                  v-numeric
                  v-max-number="COUPON_CONFIG.MAX_PERCENTAGE_OFF"
                  size="lg"
                  class="w-2/5"
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
                class="w-[170px]"
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
            class="grid grid-cols-4 gap-10"
          >
            <UInput
              v-model.number="state.max_uses"
              v-max-number="COUPON_CONFIG.MAX_USES"
              v-numeric
              :disabled="isPendingCreateCoupon"
              size="lg"
              class="w-1/2"
            />
          </UFormGroup>

          <UFormGroup
            label="Maximum Usage/Buyer"
            name="max_uses_per_user"
            class="grid grid-cols-4 gap-10"
          >
            <UInput
              v-model.number="state.max_uses_per_user"
              v-max-number="COUPON_CONFIG.MAX_USES_PER_USER"
              v-numeric
              type="number"
              :disabled="isPendingCreateCoupon"
              size="lg"
              class="w-1/2"
            />
          </UFormGroup>

          <UFormGroup
            class="grid grid-cols-4 gap-10"
            description="Your discount can apply shop-wide, or be limited to specific items."
            label="Which products can buyers use this promo code on?"
            name="applies_to"
            :ui="{ container: 'col-span-2' }"
          >
            <RadioGroupInput
              v-model="state.applies_to"
              :options="couponAppliesToOptions"
              :disabled="isPendingCreateCoupon"
              row
            />
          </UFormGroup>

          <div v-if="state.applies_to === CouponAppliesTo.SPECIFIC">
            <CreateCouponApplyCouponOnProduct v-model="state.applies_product_ids" />
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
      :disabled="isPendingCreateCoupon"
      size="sm"
      type="submit"
      color="gray"
      @click="router.push(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.COUPONS}`)"
    >
      Cancel
    </UButton>
    <UButton
      :loading="isPendingCreateCoupon"
      size="sm"
      type="submit"
      @click="() => btnSubmit.click()"
    >
      Create
    </UButton>
  </div>
</template>
