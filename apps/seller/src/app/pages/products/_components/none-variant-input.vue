<script setup lang="ts">
import { PRODUCT_CONFIG } from '@arc/enums/product'
import type { StateNoneVariant } from '~/shared/api/shop/product/contracts/form.contract'

const props = defineProps<{ disabled?: boolean, currency?: string }>()

const noneVariantModel = defineModel<StateNoneVariant>('noneVariant', {
  default: {
    stock: 1,
  },
})
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
        v-model.number="noneVariantModel.amount"
        v-max-number="PRODUCT_CONFIG.MAX_PRICE"
        v-numeric
        :disabled="props.disabled"
        size="lg"
        type="number"
        class="w-1/2"
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
        v-model.number="noneVariantModel.stock"
        v-max-number="PRODUCT_CONFIG.MAX_STOCK"
        v-numeric
        :disabled="props.disabled"
        size="lg"
        type="number"
        class="w-1/2"
      />
    </UFormGroup>
    <UFormGroup
      description="SKUs are for your use only—buyers won’t see them."
      class="mb-4"
      label="SKU"
      name="sku"
    >
      <UInput
        v-model="noneVariantModel.sku"
        v-uppercase
        v-alphanumeric
        :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
        :disabled="props.disabled"
        size="lg"
        :ui="{ base: 'uppercase' }"
        class="w-1/2"
      />
    </UFormGroup>
  </div>
</template>

<style scoped>
</style>
