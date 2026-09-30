<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import type { CartCouponItem } from '~/domains/cart/api/contracts/cart.contract'
import { useGetCartCoupons } from '~/domains/cart/queries/cart-coupons.query'
import { formatCouponDiscount, formatCouponExpiration, formatCouponIneligibleReason, formatCouponMinimum } from '~/domains/cart/utils/coupon-display'
import { useCouponSelection } from './use-coupon-selection'

const props = withDefaults(defineProps<{
  shopId: string
  shopName?: string
  cartId?: string
  codes: string[]
  panelError?: string
  disabled?: boolean
  disabledInput?: boolean
  disabledAdd?: boolean
  isApplying?: boolean
}>(), {
  shopName: '',
  cartId: undefined,
  panelError: '',
  disabled: false,
  disabledInput: false,
  disabledAdd: false,
  isApplying: false,
})

const emit = defineEmits<{
  accept: [codes: string[]]
  removeCode: [code: string]
}>()

const code = defineModel<string>('code', { required: true })
const open = defineModel<boolean>('open', { required: true })

const {
  data: dataCoupons,
  isPending: isPendingCoupons,
  isError: isErrorCoupons,
} = useGetCartCoupons({
  shop_id: () => props.shopId,
  cart_id: () => props.cartId,
  enabled: () => open.value,
})

const coupons = computed<CartCouponItem[]>(() => dataCoupons.value?.coupons ?? [])

const COMBINATION_HINT
  = 'Apply up to 2 coupons per shop: 1 shipping coupon and 1 order discount coupon.'

const {
  isValidating,
  inputCodes,
  inputError,
  selectedCount,
  canAccept,
  canSelectTwoCoupons,
  isStaged,
  isSelectable,
  toggleCode,
  stageTypedCode,
  removeInputCode,
  pendingCodes,
} = useCouponSelection({
  appliedCodes: toRef(props, 'codes'),
  coupons,
  code,
  isOpen: open,
  shopId: () => props.shopId,
  cartId: () => props.cartId,
})

function cancel() {
  open.value = false
}

function accept() {
  emit('accept', [...pendingCodes.value])
}
</script>

<template>
  <div>
    <UPopover
      v-model:open="open"
      :popper="{ placement: 'bottom-start' }"
      :disabled="props.disabled"
    >
      <UButton
        variant="ghost"
        :icon="ICON_NAME_BY_ALIAS['ticket']"
        color="gray"
        :class="['mb-2 w-fit', open && 'bg-surface-hover text-text-strong']"
        :disabled="props.disabled"
      >
        Apply shop coupon codes
      </UButton>

      <template #panel>
        <div class="w-[min(92vw,380px)] p-4">
          <div class="mb-4 text-sm font-semibold text-text-strong">
            {{ props.shopName ? `${props.shopName} Coupon` : 'Coupon' }}
          </div>

          <UAlert
            v-if="props.panelError"
            class="mb-4"
            color="rose"
            variant="solid"
            :icon="ICON_NAME_BY_ALIAS['warning']"
            :description="props.panelError"
          />

          <UFormGroup
            name="code"
            :error="inputError"
            label="Code coupon"
          >
            <UButtonGroup orientation="horizontal">
              <UInput
                v-model="code"
                v-uppercase
                :disabled="props.disabledInput || props.disabled || isValidating"
                :ui="{ base: 'uppercase' }"
              />
              <UButton
                color="gray"
                variant="solid"
                :disabled="props.disabledAdd || props.disabled || isValidating"
                @click="stageTypedCode"
              >
                Apply
              </UButton>
            </UButtonGroup>
          </UFormGroup>

          <div
            v-if="inputCodes.length > 0"
            class="mt-3 flex flex-wrap gap-3"
          >
            <div
              v-for="inputCode of inputCodes"
              :key="inputCode"
              class="relative"
            >
              <UButton color="gray">
                {{ inputCode }}
              </UButton>
              <UButton
                class="absolute -right-2 -top-3 z-[1]"
                size="2xs"
                color="gray"
                variant="solid"
                :disabled="props.disabled"
                :icon="ICON_NAME_BY_ALIAS['xMarkSolid']"
                :ui="{ rounded: 'rounded-full' }"
                @click="removeInputCode(inputCode)"
              />
            </div>
          </div>

          <div class="mt-4 flex min-h-32 flex-col justify-center">
            <div
              v-if="isPendingCoupons"
              class="py-4 text-center text-xs text-text-muted"
            >
              Loading coupons...
            </div>
            <div
              v-else-if="isErrorCoupons"
              class="py-4 text-center text-xs text-state-danger-text"
            >
              Could not load coupons for this shop.
            </div>
            <div
              v-else-if="coupons.length === 0"
              class="py-4 text-center text-xs text-text-muted"
            >
              No coupons available for this shop.
            </div>
            <div
              v-else
              class="scrollbar-subtle -mr-3 max-h-64 space-y-2 overflow-y-auto pr-2"
            >
              <button
                v-for="coupon of coupons"
                :key="coupon.code"
                type="button"
                class="flex w-full items-start justify-between gap-3 rounded border p-3 text-left transition-colors aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:opacity-60 aria-disabled:hover:bg-transparent"
                :class="isStaged(coupon) ? 'border-primary bg-surface-hover' : 'border-border-subtle hover:bg-surface-hover'"
                :disabled="props.disabled || props.isApplying || !isSelectable(coupon)"
                :aria-disabled="!isSelectable(coupon) || undefined"
                :aria-pressed="isStaged(coupon)"
                @click="toggleCode(coupon)"
              >
                <span class="text-sm font-semibold uppercase text-text-strong">
                  {{ coupon.code }}
                </span>
                <span class="flex flex-col items-end gap-1 text-right text-xs text-text-muted">
                  <span>{{ formatCouponDiscount(coupon) }}</span>
                  <span>{{ formatCouponMinimum(coupon) }}</span>
                  <span>{{ formatCouponExpiration(coupon) }}</span>
                  <span
                    v-if="formatCouponIneligibleReason(coupon.ineligible_reason)"
                    class="text-state-warning-text"
                  >
                    {{ formatCouponIneligibleReason(coupon.ineligible_reason) }}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div
            v-if="selectedCount > 0"
            class="mt-4 flex items-center gap-1"
          >
            <p
              class="text-xs text-text-muted"
              aria-live="polite"
            >
              {{ selectedCount === 1 ? '1 coupon selected' : `${selectedCount} coupons selected` }}
            </p>

            <UTooltip
              v-if="canSelectTwoCoupons"
              :text="COMBINATION_HINT"
              :popper="{ placement: 'top-start' }"
              :ui="{
                width: 'max-w-[12rem]',
                base: 'relative h-auto px-2 py-1 text-xs font-normal leading-snug text-clip whitespace-normal',
              }"
            >
              <UIcon
                :name="ICON_NAME_BY_ALIAS['info']"
                class="size-4 shrink-0 text-text-muted"
              />
            </UTooltip>
          </div>

          <div class="mt-3 flex justify-end gap-2">
            <UButton
              color="gray"
              @click="cancel"
            >
              Cancel
            </UButton>
            <UButton
              :loading="props.isApplying"
              :disabled="props.disabled || !canAccept"
              @click="accept"
            >
              Apply
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>

    <div
      v-if="props.codes.length > 0"
      class="flex gap-3"
    >
      <div
        v-for="appliedCode of props.codes"
        :key="appliedCode"
      >
        <div class="relative">
          <UButton color="gray">
            {{ appliedCode }}
          </UButton>
          <UButton
            class="absolute -right-2 -top-3 z-[1]"
            size="2xs"
            color="gray"
            variant="solid"
            :disabled="props.disabled"
            :icon="ICON_NAME_BY_ALIAS['xMarkSolid']"
            :ui="{ rounded: 'rounded-full' }"
            @click="emit('removeCode', appliedCode)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
