<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import type { CartPromoCodeItem } from '~/domains/cart/api/contracts/cart.contract'
import { useGetCartPromoCodes } from '~/domains/cart/queries/cart-promo-codes.query'
import { formatPromoCodeDiscount, formatPromoCodeExpiration, formatPromoCodeIneligibleReason, formatPromoCodeMinimum } from '~/domains/cart/utils/promo-code-display'
import { usePromoCodeSelection } from './use-promo-code-selection'

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
  data: dataPromoCodes,
  isPending: isPendingPromoCodes,
  isError: isErrorPromoCodes,
} = useGetCartPromoCodes({
  shop_id: () => props.shopId,
  cart_id: () => props.cartId,
  enabled: () => open.value,
})

const promoCodes = computed<CartPromoCodeItem[]>(() => dataPromoCodes.value?.promo_codes ?? [])

const COMBINATION_HINT
  = 'Apply up to 2 promo codes per shop: 1 free-shipping code and 1 product-discount code.'

const {
  isValidating,
  inputCodes,
  inputError,
  selectedCount,
  canAccept,
  canSelectTwoPromoCodes,
  isStaged,
  isSelectable,
  toggleCode,
  stageTypedCode,
  removeInputCode,
  pendingCodes,
} = usePromoCodeSelection({
  appliedCodes: toRef(props, 'codes'),
  promoCodes,
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
        :class="['w-fit', open && 'bg-surface-hover text-text-strong']"
        :disabled="props.disabled"
      >
        Apply shop promo codes
      </UButton>

      <template #panel>
        <div class="w-[min(92vw,380px)] p-4">
          <div class="mb-4 text-sm font-semibold text-text-strong">
            {{ props.shopName ? `${props.shopName} Promo Code` : 'Promo Code' }}
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
            label="Promo code"
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
              v-if="isPendingPromoCodes"
              class="py-4 text-center text-xs text-text-muted"
            >
              Loading promo codes...
            </div>
            <div
              v-else-if="isErrorPromoCodes"
              class="py-4 text-center text-xs text-state-danger-text"
            >
              Could not load promo codes for this shop.
            </div>
            <div
              v-else-if="promoCodes.length === 0"
              class="py-4 text-center text-xs text-text-muted"
            >
              No promo codes available for this shop.
            </div>
            <div
              v-else
              class="scrollbar-subtle -mr-3 max-h-64 space-y-2 overflow-y-auto pr-2"
            >
              <button
                v-for="promoCode of promoCodes"
                :key="promoCode.code"
                type="button"
                class="flex w-full items-start justify-between gap-3 rounded border p-3 text-left transition-colors aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:opacity-60 aria-disabled:hover:bg-transparent"
                :class="isStaged(promoCode) ? 'border-primary bg-surface-hover' : 'border-border-subtle hover:bg-surface-hover'"
                :disabled="props.disabled || props.isApplying || !isSelectable(promoCode)"
                :aria-disabled="!isSelectable(promoCode) || undefined"
                :aria-pressed="isStaged(promoCode)"
                @click="toggleCode(promoCode)"
              >
                <span class="text-sm font-semibold uppercase text-text-strong">
                  {{ promoCode.code }}
                </span>
                <span class="flex flex-col items-end gap-1 text-right text-xs text-text-muted">
                  <span>{{ formatPromoCodeDiscount(promoCode) }}</span>
                  <span>{{ formatPromoCodeMinimum(promoCode) }}</span>
                  <span>{{ formatPromoCodeExpiration(promoCode) }}</span>
                  <span
                    v-if="formatPromoCodeIneligibleReason(promoCode.ineligible_reason)"
                    class="text-state-warning-text"
                  >
                    {{ formatPromoCodeIneligibleReason(promoCode.ineligible_reason) }}
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
              {{ selectedCount === 1 ? '1 promo code selected' : `${selectedCount} promo codes selected` }}
            </p>

            <UTooltip
              v-if="canSelectTwoPromoCodes"
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
      class="mt-2 flex gap-3"
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
