<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { useCartItemOptionsEdit } from './use-cart-item-options-edit'
import { useShopCartCopy } from '../use-shop-cart-copy'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'

const props = withDefaults(defineProps<{
  productCart: CartProductItem
  siblingItems?: CartProductItem[]
  disabled?: boolean
}>(), {
  siblingItems: () => [],
  disabled: false,
})

const {
  open,
  panelError,
  product,
  isPendingProduct,
  isErrorProduct,
  optionMode,
  selectedOptionsLabel,
  selectedValues,
  variantOptions,
  subVariantOptions,
  mergeState,
  canApply,
  canApplyReduced,
  isPendingUpdate,
  cancel,
  apply,
} = useCartItemOptionsEdit({
  productCart: toRef(props, 'productCart'),
  siblingItems: toRef(props, 'siblingItems'),
})

const t = useShopCartCopy()

/**
 * The merge state carries the numbers; the labels are rendered here so the
 * picker's copy follows the buyer's locale.
 */
const mergeNoteLabel = computed(() => {
  const mergeItem = mergeState.value.mergeItem

  if (!mergeItem || mergeState.value.exceedsStock) {
    return ''
  }

  const label = mergeItem.inventory.selected_options
    .map(option => `${option.option_name}: ${option.value}`)
    .join(', ')

  return t('cart.options.mergeNote', {
    label: label ? ` (${label})` : '',
    from: mergeItem.quantity,
    to: mergeState.value.mergedQuantity,
  })
})

const stockWarningLabel = computed(() => {
  const state = mergeState.value

  if (!state.exceedsStock) {
    return ''
  }

  if (!state.mergeItem) {
    return t('cart.options.stockRemaining', {
      stock: state.maxAddableQuantity,
      quantity: props.productCart.quantity,
    })
  }

  if (state.maxAddableQuantity === 0) {
    return t('cart.options.stockAll', {
      stock: state.availableStock,
    })
  }

  return t('cart.options.stockMerge', {
    stock: state.mergeItem.quantity + state.maxAddableQuantity,
    held: state.mergeItem.quantity,
    addable: state.maxAddableQuantity,
  })
})
</script>

<template>
  <div v-if="props.productCart.inventory.selected_options.length > 0">
    <UPopover
      v-model:open="open"
      :popper="{ placement: 'bottom-start' }"
      :disabled="props.disabled"
      :ui="{ base: 'overflow-visible focus:outline-none relative' }"
    >
      <UButton
        variant="ghost"
        color="gray"
        class="-ml-1 h-auto w-fit gap-1 px-1 py-0 text-text-muted"
        :class="open && 'bg-surface-hover text-text-strong'"
        :disabled="props.disabled"
        size="xl"
      >
        {{ selectedOptionsLabel }}
        <AppIcon
          :name="open ? 'chevronUp' : 'chevronDown'"
          size="xs"
        />
      </UButton>

      <template #panel>
        <div class="w-[min(92vw,300px)] p-4">
          <div class="mb-4 text-sm font-semibold text-text-strong">
            {{ t('cart.options.editTitle') }}
          </div>

          <UAlert
            v-if="panelError"
            class="mb-4"
            color="rose"
            variant="solid"
            :icon="ICON_NAME_BY_ALIAS['warning']"
            :description="panelError"
          />

          <Empty
            v-if="isPendingProduct"
            loading
            variant="naked"
            :description="t('cart.options.loading')"
          />
          <Empty
            v-else-if="isErrorProduct"
            variant="naked"
            size="sm"
            :icon="ICON_NAME_BY_ALIAS['warning']"
            :description="t('cart.options.loadError')"
          />
          <Empty
            v-else-if="optionMode === 'none'"
            variant="naked"
            size="sm"
            :icon="ICON_NAME_BY_ALIAS['product']"
            :description="t('cart.options.empty')"
          />
          <div
            v-else
            class="space-y-4"
          >
            <UFormGroup
              :label="product?.options[0]?.name"
              name="variantOption"
            >
              <USelectMenu
                v-model="selectedValues[0]"
                :placeholder="t('cart.options.selectPlaceholder', { option: product?.options[0]?.name ?? 'variant' })"
                size="lg"
                :options="variantOptions"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>

            <UFormGroup
              v-if="optionMode === 'combine'"
              :label="product?.options[1]?.name"
              name="variantSubOption"
            >
              <USelectMenu
                v-model="selectedValues[1]"
                :placeholder="t('cart.options.selectPlaceholder', { option: product?.options[1]?.name ?? 'variant' })"
                size="lg"
                :options="subVariantOptions"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>

            <p
              v-if="mergeNoteLabel"
              class="text-xs text-text-muted"
            >
              {{ mergeNoteLabel }}
            </p>

            <p
              v-if="stockWarningLabel"
              class="text-xs text-state-warning-text"
            >
              {{ stockWarningLabel }}
            </p>
          </div>

          <div class="mt-3 flex justify-end gap-2">
            <UButton
              color="gray"
              @click="cancel"
            >
              {{ t('cart.options.cancel') }}
            </UButton>
            <UButton
              v-if="canApplyReduced"
              :loading="isPendingUpdate"
              :disabled="props.disabled"
              @click="apply(mergeState.maxAddableQuantity)"
            >
              {{ t('cart.options.addInstead', { count: mergeState.maxAddableQuantity }) }}
            </UButton>
            <UButton
              :loading="isPendingUpdate"
              :disabled="props.disabled || !canApply"
              @click="apply()"
            >
              {{ t('cart.options.apply') }}
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
