<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { useCartItemOptionsEdit } from './use-cart-item-options-edit'
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
        <UIcon
          :name="ICON_NAME_BY_ALIAS[open ? 'chevronUp' : 'chevronDown']"
          class="size-3.5 shrink-0"
        />
      </UButton>

      <template #panel>
        <div class="w-[min(92vw,300px)] p-4">
          <div class="mb-4 text-sm font-semibold text-text-strong">
            Edit options
          </div>

          <UAlert
            v-if="panelError"
            class="mb-4"
            color="rose"
            variant="solid"
            :icon="ICON_NAME_BY_ALIAS['warning']"
            :description="panelError"
          />

          <div
            v-if="isPendingProduct"
            class="py-4 text-center text-xs text-text-muted"
          >
            Loading options...
          </div>
          <div
            v-else-if="isErrorProduct"
            class="py-4 text-center text-xs text-state-danger-text"
          >
            Could not load product options.
          </div>
          <div
            v-else-if="optionMode === 'none'"
            class="py-4 text-center text-xs text-text-muted"
          >
            This product has no options to edit.
          </div>
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
                :placeholder="`Select a ${product?.options[0]?.name ?? 'variant'}`"
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
                :placeholder="`Select a ${product?.options[1]?.name ?? 'variant'}`"
                size="lg"
                :options="subVariantOptions"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>

            <p
              v-if="mergeState.mergeNote"
              class="text-xs text-text-muted"
            >
              {{ mergeState.mergeNote }}
            </p>

            <p
              v-if="mergeState.stockWarning"
              class="text-xs text-state-warning-text"
            >
              {{ mergeState.stockWarning }}
            </p>
          </div>

          <div class="mt-3 flex justify-end gap-2">
            <UButton
              color="gray"
              @click="cancel"
            >
              Cancel
            </UButton>
            <UButton
              v-if="canApplyReduced"
              :loading="isPendingUpdate"
              :disabled="props.disabled"
              @click="apply(mergeState.maxAddableQuantity)"
            >
              Add {{ mergeState.maxAddableQuantity }} instead
            </UButton>
            <UButton
              :loading="isPendingUpdate"
              :disabled="props.disabled || !canApply"
              @click="apply()"
            >
              Apply
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
