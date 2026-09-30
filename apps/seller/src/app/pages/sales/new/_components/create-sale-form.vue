<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { PromotionProductScope } from '@arc/enums/promotion'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import ApplyProductTargets from '~/domains/shop/ui/apply-product-targets.vue'
import SalePricePreview from './sale-price-preview.vue'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import FixedFormActions from '~/shared/ui/fixed-form-actions.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopCreateSale } from '~/domains/shop/mutations/create-sale.mutation'
import { toastCustom } from '~/shared/config/toast'
import {
  createSaleFormSchema,
  isAmbiguousLocalTime,
  toSaleScheduleInstant,
  type CreateSaleFormState,
} from '~/domains/shop/schemas/sale/create-sale-form.schema'
import { parseLocalDateTime } from '~/domains/shop/utils/zoned-local-date-time'
import type { CreateShopSaleRequestBody } from '~/domains/shop/api/sale/contracts/sale.contract'

const router = useRouter()
const toast = useToast()

const {
  mutateAsync: createSale,
  isPending: isPendingCreateSale,
} = useShopCreateSale()

const productScopeOptions = [
  { value: PromotionProductScope.ALL, label: 'All products' },
  { value: PromotionProductScope.SPECIFIC, label: 'Select products' },
]

const startModeOptions = [
  { value: 'now', label: 'Start now' },
  { value: 'scheduled', label: 'Schedule for later' },
]

const occurrenceOptions = [
  { value: 'earlier', label: 'Earlier occurrence (daylight time)' },
  { value: 'later', label: 'Later occurrence (standard time)' },
]

const state = reactive<CreateSaleFormState>({
  name: '',
  percent_off: 10,
  product_scope: PromotionProductScope.ALL,
  product_ids: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  start_mode: 'now',
  start_local: '',
  end_local: '',
  start_occurrence: undefined,
  end_occurrence: undefined,
})

const timezoneOptions = Intl.supportedValuesOf('timeZone')
const formRef = ref()
const btnSubmit = ref()

const startIsAmbiguous = computed(() => {
  if (state.start_mode !== 'scheduled') {
    return false
  }

  const parts = parseLocalDateTime(state.start_local)

  return parts ? isAmbiguousLocalTime(parts, state.timezone) : false
})

const endIsAmbiguous = computed(() => {
  const parts = parseLocalDateTime(state.end_local)

  return parts ? isAmbiguousLocalTime(parts, state.timezone) : false
})

const submitLabel = computed(() =>
  state.start_mode === 'now' ? 'Start sale' : 'Schedule sale')

const validate = (values: CreateSaleFormState): FormError[] => {
  const result = createSaleFormSchema.safeParse(values)

  if (result.success) {
    return []
  }

  return result.error.issues.map(issue => ({
    path: typeof issue.path.at(-1) === 'string' ? String(issue.path.at(-1)) : '',
    message: issue.message,
  }))
}

async function onSubmit(event: FormSubmitEvent<CreateSaleFormState>) {
  formRef.value.clear()

  const end = toSaleScheduleInstant(
    event.data.end_local,
    event.data.timezone,
    event.data.end_occurrence,
  )
  const start = event.data.start_mode === 'now'
    ? undefined
    : toSaleScheduleInstant(
        event.data.start_local,
        event.data.timezone,
        event.data.start_occurrence,
      )

  const payload: CreateShopSaleRequestBody = {
    name: event.data.name.trim(),
    percent_off: event.data.percent_off,
    product_scope: event.data.product_scope,
    timezone: event.data.timezone,
    end_local: end.local,
    end_offset_minutes: end.offsetMinutes,
    ...(event.data.product_scope === PromotionProductScope.SPECIFIC
      ? { product_ids: event.data.product_ids }
      : {}),
    ...(start
      ? { start_local: start.local, start_offset_minutes: start.offsetMinutes }
      : { start_now: true }),
  }

  try {
    await createSale(payload)
    await router.push(routes.sales())
    toast.add({
      ...toastCustom.success,
      title: state.start_mode === 'now' ? 'Sale started' : 'Sale scheduled',
    })
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Could not create the sale',
      description: error instanceof Error ? error.message : undefined,
    })
  }
}

function onError(event: FormErrorEvent) {
  const element = document.getElementById(event.errors[0]?.id ?? '')
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <div>
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
                :options="productScopeOptions"
                :disabled="isPendingCreateSale"
                row
              />
            </UFormGroup>

            <div v-if="state.product_scope === PromotionProductScope.SPECIFIC">
              <ApplyProductTargets v-model="state.product_ids" />
              <div
                v-if="formRef?.getErrors('product_ids')[0]?.message"
                class="mt-2 text-state-danger-text"
              >
                {{ formRef.getErrors('product_ids')[0].message }}
              </div>
            </div>
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
                :options="startModeOptions"
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
              <div
                v-if="formRef?.getErrors('start_local')[0]?.message"
                class="mt-1 text-sm text-state-danger-text"
              >
                {{ formRef.getErrors('start_local')[0].message }}
              </div>
              <div
                v-if="startIsAmbiguous"
                class="mt-2 space-y-2"
              >
                <p class="text-sm text-text-muted">
                  This local time occurs twice. Choose which occurrence to use.
                </p>
                <USelectMenu
                  v-model="state.start_occurrence"
                  :options="occurrenceOptions"
                  value-attribute="value"
                  name-attribute="label"
                  size="lg"
                  class="w-80"
                />
              </div>
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
              <div
                v-if="formRef?.getErrors('end_local')[0]?.message"
                class="mt-1 text-sm text-state-danger-text"
              >
                {{ formRef.getErrors('end_local')[0].message }}
              </div>
              <div
                v-if="endIsAmbiguous"
                class="mt-2 space-y-2"
              >
                <p class="text-sm text-text-muted">
                  This local time occurs twice. Choose which occurrence to use.
                </p>
                <USelectMenu
                  v-model="state.end_occurrence"
                  :options="occurrenceOptions"
                  value-attribute="value"
                  name-attribute="label"
                  size="lg"
                  class="w-80"
                />
              </div>
            </UFormGroup>

            <UFormGroup
              label="Timezone"
              name="timezone"
              description="Defaults to your browser timezone and is saved with the sale, so travelling does not reinterpret the schedule."
              required
            >
              <USelectMenu
                v-model="state.timezone"
                :options="timezoneOptions"
                searchable
                size="lg"
                class="w-96"
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

      <button
        ref="btnSubmit"
        type="submit"
        class="hidden"
      />
    </UForm>

    <FixedFormActions>
      <UButton
        :disabled="isPendingCreateSale"
        size="sm"
        color="gray"
        @click="router.push(routes.sales())"
      >
        Cancel
      </UButton>
      <UButton
        :loading="isPendingCreateSale"
        size="sm"
        @click="() => btnSubmit.click()"
      >
        {{ submitLabel }}
      </UButton>
    </FixedFormActions>
  </div>
</template>
