<script setup lang="ts">
import { ProductVariantTypes } from '@arc/enums/product'
import type {
  StateCombineVariant,
  StateSingleVariant,
} from '~/domains/shop/api/product/contracts/form.contract'
import { useVariantInput } from './use-variant-input'
import ProductVariantInput from '~/app/pages/products/_components/variant-input/product-variant-input.vue'

const props = defineProps<{ countValidate: number, currency?: string }>()

const singleVariantModel = defineModel<StateSingleVariant>('singleVariant', {
  default: {},
})

const combineVariantModel = defineModel<StateCombineVariant>('combineVariant', {
  default: {},
})

const variantTypeModel = defineModel<ProductVariantTypes>('variantType', {
  default: ProductVariantTypes.SINGLE,
})

const {
  addSubVariant,
  addVariant,
  closeSubVariant,
  columns,
  openSubVariant,
  removeSubVariant,
  removeVariant,
  rowsTable,
  state,
  updateSubVariantName,
  updateVariantName,
} = useVariantInput({
  countValidate: toRef(props, 'countValidate'),
  singleVariantModel,
  combineVariantModel,
  variantTypeModel,
})
</script>

<template>
  <ProductVariantInput
    v-model:state="state"
    :rows="rowsTable"
    :columns="columns"
    :currency="props.currency"
    uppercase-sku
    @add-variant="addVariant"
    @remove-variant="removeVariant"
    @update-variant-name="updateVariantName"
    @add-sub-variant="addSubVariant"
    @close-sub-variant="closeSubVariant"
    @open-sub-variant="openSubVariant"
    @remove-sub-variant="removeSubVariant"
    @update-sub-variant-name="updateSubVariantName"
  />
</template>
