<script setup lang="ts">
import type { IOnChangeUpdateVariants } from '../use-update-product-form/update-product-form.types'
import type { ProductSkuConflict } from '../use-update-product-form/use-update-product-submit/product-section-state'
import type { VariantEditorProduct } from './update-variant-input.types'
import { useUpdateVariantInput } from './use-update-variant-input'
import ProductVariantInput from '~/app/pages/products/_components/variant-input/product-variant-input.vue'

const props = defineProps<{
  countValidate: number
  product: VariantEditorProduct
  skuConflicts?: ProductSkuConflict[]
}>()

const emit = defineEmits<{
  (e: 'onChange', value: IOnChangeUpdateVariants | null): void
  (e: 'isVariantsUpdated', value: boolean): void
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
  product: toRef(props, 'product'),
  skuConflicts: toRef(props, 'skuConflicts'),
  emitChange: value => emit('onChange', value),
  emitVariantsUpdated: value => emit('isVariantsUpdated', value),
})
</script>

<template>
  <ProductVariantInput
    v-model:state="state"
    :rows="rowsTable"
    :columns="columns"
    uppercase-sku
    @add-variant="addVariant"
    @remove-variant="removeVariant"
    @update-variant-name="updateVariantName"
    @add-sub-variant="addSubVariant"
    @close-sub-variant="closeSubVariant"
    @open-sub-variant="openSubVariant"
    @remove-sub-variant="removeSubVariant"
    @update-sub-variant-name="updateSubVariantName"
    @row-input="onChangeInputTable"
  />
</template>
