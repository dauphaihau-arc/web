<script setup lang="ts">
import type { IOnChangeUpdateVariants } from '../update-product-form.types'
import type { VariantEditorProduct } from './update-variant-input.types'
import { useUpdateVariantInput } from './use-update-variant-input'
import VariantInventoryTable from '~/app/pages/products/_components/variant-input/variant-inventory-table.vue'
import VariantOptionGroup from '~/app/pages/products/_components/variant-input/variant-option-group.vue'

const props = defineProps<{
  countValidate: number
  product: VariantEditorProduct
}>()

const emit = defineEmits<{
  (e: 'onChange', value: IOnChangeUpdateVariants | null): void
  (e: 'isVariantsUpdated', value: number): void
}>()

const {
  addSubVariant,
  addVariant,
  closeSubVariant,
  columns,
  onChangeInputTable,
  openSubVariant,
  removeSubVariant,
  removeVariant,
  rowsTable,
  state,
  updateSubVariantName,
  updateVariantName,
} = useUpdateVariantInput({
  countValidate: toRef(props, 'countValidate'),
  product: props.product,
  emitChange: value => emit('onChange', value),
  emitVariantsUpdated: value => emit('isVariantsUpdated', value),
})
</script>

<template>
  <div>
    <div class="flex gap-20">
      <VariantOptionGroup
        v-model:group-name="state.variant_group_name"
        v-model:option-name="state.variantOption"
        title="Group variant 1"
        :error-group-name="state.errorVariantGroupName"
        :error-option="state.errorVariantOption"
        :options="state.variants"
        show-inline-option-error
        @add="addVariant"
        @remove="removeVariant"
        @update-name="updateVariantName"
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
        title="Group variant 2"
        group-name-field-name="variant_sub_group_name"
        show-open-button
        show-close-button
        :is-active="state.isActiveSubVariant"
        :error-group-name="state.errorVariantSubGroupName"
        :error-option="state.errorSubVariantOption"
        :limit-option-name="false"
        :options="state.subVariants"
        @add="addSubVariant"
        @close="closeSubVariant"
        @open="openSubVariant"
        @remove="removeSubVariant"
        @update-name="updateSubVariantName"
      />
    </div>

    <VariantInventoryTable
      :rows="rowsTable"
      :columns="columns"
      uppercase-sku
      @row-input="onChangeInputTable"
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
