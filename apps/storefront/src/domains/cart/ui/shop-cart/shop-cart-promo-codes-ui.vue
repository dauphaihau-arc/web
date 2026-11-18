<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PromoCodeIneligibleReason, PromotionBenefitType, PromotionMinOrderType } from '@arc/enums/promotion'
import type { MarketCurrencies } from '@arc/enums/market'
import formatCurrency from '@arc/utils/format-currency'
import dayjs from 'dayjs'
import type { CartPromoCodeItem } from '~/domains/cart/api/contracts/cart.contract'
import { useGetCartPromoCodes } from '~/domains/cart/queries/cart-promo-codes.query'
import { usePromoCodeSelection } from './use-promo-code-selection'
import { useShopCartCopy } from './use-shop-cart-copy'

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

const t = useShopCartCopy()

const EXPIRATION_FORMAT = 'MMM DD, YYYY'

function promoCodeDiscountLabel(promoCode: CartPromoCodeItem): string {
  if (promoCode.benefit_type === PromotionBenefitType.FREE_SHIPPING) {
    return t('cart.promo.freeShipping')
  }

  if (promoCode.benefit_type === PromotionBenefitType.PERCENTAGE) {
    return promoCode.percent_off == null
      ? t('cart.promo.discount')
      : t('cart.promo.percentOff', { percent: promoCode.percent_off })
  }

  return promoCode.amount_off == null
    ? t('cart.promo.discount')
    : t('cart.promo.amountOff', {
        amount: formatCurrency(promoCode.amount_off, promoCode.currency as MarketCurrencies),
      })
}

function promoCodeMinimumLabel(promoCode: CartPromoCodeItem): string {
  if (promoCode.min_order_type === PromotionMinOrderType.ORDER_TOTAL) {
    return promoCode.min_order_value == null
      ? t('cart.promo.noMinimum')
      : t('cart.promo.minimumSpend', {
          amount: formatCurrency(promoCode.min_order_value, promoCode.currency as MarketCurrencies),
        })
  }

  if (promoCode.min_order_type === PromotionMinOrderType.PURCHASE_QUANTITY) {
    return promoCode.min_purchase_quantity == null
      ? t('cart.promo.noMinimumQuantity')
      : t('cart.promo.minimumQuantity', { count: promoCode.min_purchase_quantity })
  }

  return t('cart.promo.noMinimum')
}

function promoCodeExpirationLabel(promoCode: CartPromoCodeItem): string {
  const expiresAt = dayjs(promoCode.end_date)

  return expiresAt.isValid()
    ? t('cart.promo.expires', { date: expiresAt.format(EXPIRATION_FORMAT) })
    : ''
}

function promoCodeIneligibleLabel(reason: CartPromoCodeItem['ineligible_reason']): string {
  const keys: Record<PromoCodeIneligibleReason, string> = {
    [PromoCodeIneligibleReason.EXPIRED]: 'cart.promo.ineligible.expired',
    [PromoCodeIneligibleReason.NOT_STARTED]: 'cart.promo.ineligible.notStarted',
    [PromoCodeIneligibleReason.USAGE_LIMIT_REACHED]: 'cart.promo.ineligible.usageLimitReached',
    [PromoCodeIneligibleReason.USER_USAGE_LIMIT_REACHED]: 'cart.promo.ineligible.userUsageLimitReached',
    [PromoCodeIneligibleReason.AUTHENTICATION_REQUIRED]: 'cart.promo.ineligible.authenticationRequired',
    [PromoCodeIneligibleReason.PRODUCT_SCOPE]: 'cart.promo.ineligible.productScope',
    [PromoCodeIneligibleReason.MIN_ORDER_VALUE]: 'cart.promo.ineligible.minOrderValue',
    [PromoCodeIneligibleReason.MIN_PRODUCTS]: 'cart.promo.ineligible.minProducts',
    [PromoCodeIneligibleReason.ZERO_BENEFIT]: 'cart.promo.ineligible.zeroBenefit',
  }

  return reason == null ? '' : t(keys[reason])
}

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
        {{ t('cart.promo.applyShop') }}
      </UButton>

      <template #panel>
        <div class="w-[min(92vw,380px)] p-4">
          <div class="mb-4 text-sm font-semibold text-text-strong">
            {{ props.shopName ? t('cart.promo.shopTitle', { shop: props.shopName }) : t('cart.promo.title') }}
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
            :label="t('cart.promo.codeLabel')"
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
                {{ t('cart.promo.apply') }}
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
            <Empty
              v-if="isPendingPromoCodes"
              loading
              variant="naked"
              size="lg"
              :description="t('cart.promo.loading')"
            />
            <Empty
              v-else-if="isErrorPromoCodes"
              variant="naked"
              size="lg"
              :icon="ICON_NAME_BY_ALIAS['warning']"
              :description="t('cart.promo.loadError')"
            />
            <Empty
              v-else-if="promoCodes.length === 0"
              variant="naked"
              size="lg"
              class="-mx-4"
              :icon="ICON_NAME_BY_ALIAS['ticketPercent']"
              :title="t('cart.promo.emptyTitle')"
              :description="t('cart.promo.emptyDescription')"
            />
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
                  <span>{{ promoCodeDiscountLabel(promoCode) }}</span>
                  <span>{{ promoCodeMinimumLabel(promoCode) }}</span>
                  <span>{{ promoCodeExpirationLabel(promoCode) }}</span>
                  <span
                    v-if="promoCodeIneligibleLabel(promoCode.ineligible_reason)"
                    class="text-state-warning-text"
                  >
                    {{ promoCodeIneligibleLabel(promoCode.ineligible_reason) }}
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
              {{ selectedCount === 1 ? t('cart.promo.selectedOne') : t('cart.promo.selectedMany', { count: selectedCount }) }}
            </p>

            <UTooltip
              v-if="canSelectTwoPromoCodes"
              :text="t('cart.promo.combinationHint')"
              :popper="{ placement: 'top-start' }"
              :ui="{
                width: 'max-w-[12rem]',
                base: 'relative h-auto px-2 py-1 text-xs font-normal leading-snug text-clip whitespace-normal',
              }"
            >
              <AppIcon
                name="info"
                size="xs"
                class="text-text-muted"
              />
            </UTooltip>
          </div>

          <div class="mt-3 flex justify-end gap-2">
            <UButton
              color="gray"
              @click="cancel"
            >
              {{ t('cart.promo.cancel') }}
            </UButton>
            <UButton
              :loading="props.isApplying"
              :disabled="props.disabled || !canAccept"
              @click="accept"
            >
              {{ t('cart.promo.apply') }}
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
