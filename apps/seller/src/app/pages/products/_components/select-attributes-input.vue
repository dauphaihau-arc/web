<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { useGetAttributesByCategory } from '~/domains/category/queries/attributes.query'
import type { ReqAttributeOption } from '~/domains/shop/api/product/contracts/form.contract'

type ProductAttributeSelection = {
  attribute: string
  selected: string
}

const props = defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  category_id?: Category['id']
  attributesSelected?: ProductAttributeSelection[]
}>()

const attributesModel = defineModel<ReqAttributeOption[] | undefined>({
  default: [],
  required: true,
})

const {
  data: dataGetAttributesByCategory,
} = useGetAttributesByCategory(props.category_id)

const state = reactive<Record<ReqAttributeOption['attribute_id'], ReqAttributeOption['selected']>>({})

watch(() => dataGetAttributesByCategory.value, () => {
  Object.keys(state).forEach((key) => {
    state[key] = ''
  })

  const attributes = dataGetAttributesByCategory.value?.attributes

  if (!attributes) {
    return
  }

  props.attributesSelected?.forEach((attr) => {
    const attribute = attributes.find(
      item => item.id === attr.attribute,
    )

    if (!attribute) {
      return
    }

    const selectedOption = attribute.options?.find(option =>
      option.id === attr.selected || option.value === attr.selected,
    )

    state[attr.attribute] = selectedOption?.id ?? attr.selected
  })
}, { immediate: true })

watch(() => state, () => {
  const attrsValid: ReqAttributeOption[] = []
  Object.keys(state).forEach((key) => {
    if (state[key]) {
      attrsValid.push({
        attribute_id: key,
        selected: state[key],
      })
    }
  })
  attributesModel.value = attrsValid
}, { deep: true, immediate: true })
</script>

<template>
  <div
    v-if="dataGetAttributesByCategory?.attributes && dataGetAttributesByCategory.attributes.length > 0"
    class="flex min-w-0 flex-wrap gap-x-4"
  >
    <div
      v-for="attr of dataGetAttributesByCategory.attributes"
      :key="attr.id"
    >
      <UFormGroup
        :label="attr.name"
        name="type"
        class="group relative mb-4"
      >
        <USelectMenu
          v-model="state[attr.id]"
          class="w-full min-w-0 lg:w-52"
          :options="attr.options"
          option-attribute="value"
          value-attribute="id"
          size="lg"
        />
        <div
          v-if="state[attr.id]"
          class="hidden group-hover:block"
        >
          <UIcon
            name="i-material-symbols:cancel-rounded"
            class="absolute right-9 top-3 size-4 cursor-pointer text-text-muted"
            @click="() => state[attr.id] = ''"
          />
        </div>
      </UFormGroup>
    </div>
  </div>
</template>
