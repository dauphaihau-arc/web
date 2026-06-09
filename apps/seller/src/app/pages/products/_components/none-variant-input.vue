<script setup lang="ts">
import { PRODUCT_CONFIG } from '@arc/enums/product'
import type { StateNoneVariant } from '~/shared/api/shop/product/contracts/form.contract'

const props = defineProps<{ disabled?: boolean, currency?: string }>()

const noneVariantModel = defineModel<StateNoneVariant>('noneVariant', {
  default: {
    stock: 1,
  },
})

function setAmount(value: string | number) {
  noneVariantModel.value.amount = Number(value)
}

function setStock(value: string | number) {
  noneVariantModel.value.stock = Number(value)
}

function setSku(value: string | number) {
  noneVariantModel.value.sku = String(value ?? '')
}
</script>

<template>
  <div>
    <UFormGroup
      class="mb-4"
      label="Price"
      name="amount"
      required
    >
      <UInput
        v-max-number="PRODUCT_CONFIG.MAX_PRICE"
        v-numeric
        :model-value="noneVariantModel.amount"
        :disabled="props.disabled"
        size="lg"
        type="number"
        class="w-1/2"
        @update:model-value="setAmount"
      >
        <template #trailing>
          <span class="text-xs text-text-muted">{{ props.currency ?? 'USD' }}</span>
        </template>
      </UInput>
    </UFormGroup>
    <UFormGroup
      class="mb-4"
      label="Stock"
      name="stock"
      required
    >
      <UInput
        v-max-number="PRODUCT_CONFIG.MAX_STOCK"
        v-numeric
        :model-value="noneVariantModel.stock"
        :disabled="props.disabled"
        size="lg"
        type="number"
        class="w-1/2"
        @update:model-value="setStock"
      />
    </UFormGroup>
    <UFormGroup
      description="SKUs are for your use only—buyers won’t see them."
      class="mb-4"
      label="SKU"
      name="sku"
    >
      <UInput
        v-uppercase
        v-alphanumeric
        :model-value="noneVariantModel.sku"
        :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
        :disabled="props.disabled"
        size="lg"
        :ui="{ base: 'uppercase' }"
        class="w-1/2"
        @update:model-value="setSku"
      />
    </UFormGroup>
  </div>
</template>

<style scoped>
</style>
