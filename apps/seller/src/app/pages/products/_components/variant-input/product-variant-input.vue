<script setup lang="ts">
import type { VariantInputColumn, VariantInputState, VariantInputTableRow } from './variant-input.types'
import VariantInventoryTable from './variant-inventory-table.vue'
import VariantOptionGroup from './variant-option-group.vue'

const props = defineProps<{
  columns: VariantInputColumn[]
  currency?: string
  rows: VariantInputTableRow[]
  uppercaseSku?: boolean
}>()

const state = defineModel<VariantInputState>('state', { required: true })

const emit = defineEmits<{
  addSubVariant: []
  addVariant: []
  closeSubVariant: []
  openSubVariant: []
  removeSubVariant: [option: VariantInputState['subVariants'][number]]
  removeVariant: [option: VariantInputState['variants'][number]]
  rowInput: [event: Event, row: VariantInputTableRow]
  updateSubVariantName: [option: VariantInputState['subVariants'][number], value: string]
  updateVariantName: [option: VariantInputState['variants'][number], value: string]
}>()
</script>

<template>
  <div>
    <div class="flex gap-20">
      <VariantOptionGroup
        v-model:group-name="state.variant_group_name"
        v-model:option-name="state.variantOption"
        :error-group-name="state.errorVariantGroupName"
        :error-option="state.errorVariantOption"
        :options="state.variants"
        show-inline-option-error
        @add="emit('addVariant')"
        @remove="option => emit('removeVariant', option)"
        @update-name="(option, value) => emit('updateVariantName', option, value)"
      />

      <div class="flex justify-center">
        <UDivider
          color="gray"
          orientation="vertical"
          class="w-fit"
        />
      </div>

      <VariantOptionGroup
        v-model:group-name="state.variant_sub_group_name"
        v-model:option-name="state.subVariantOption"
        group-name-field-name="variant_sub_group_name"
        show-open-button
        show-close-button
        :is-active="state.isActiveSubVariant"
        :error-group-name="state.errorVariantSubGroupName"
        :error-option="state.errorSubVariantOption"
        :limit-option-name="false"
        :options="state.subVariants"
        @add="emit('addSubVariant')"
        @close="emit('closeSubVariant')"
        @open="emit('openSubVariant')"
        @remove="option => emit('removeSubVariant', option)"
        @update-name="(option, value) => emit('updateSubVariantName', option, value)"
      />
    </div>

    <VariantInventoryTable
      :rows="props.rows"
      :columns="props.columns"
      :currency="props.currency"
      :uppercase-sku="props.uppercaseSku"
      @row-input="(event, row) => emit('rowInput', event, row)"
    />
  </div>
</template>

<style scoped lang="postcss">
:deep(.hint-text-input) {
  @apply text-text-muted text-xs;
}

:deep(.error-message) {
  @apply mt-2 text-state-danger-text text-sm h-[18px];
}
</style>
