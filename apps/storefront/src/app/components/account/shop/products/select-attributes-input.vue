<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { useGetAttributesByCategory } from '~/shared/server-state/category/attributes.query'
import type { ReqAttributeOption } from '~/shared/api/shop/product/contracts/form.contract'

type ProductAttributeSelection = {
  attribute: string
  selected: string
}

const { category_id, attributesSelected } = defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  category_id?: Category['id']
  attributesSelected?: ProductAttributeSelection[]
}
>()

const attributesModel = defineModel<ReqAttributeOption[] | undefined>({
  default: [],
  required: true,
})

const {
  data: dataGetAttributesByCategory,
} = useGetAttributesByCategory(category_id)

const state = reactive<Record<ReqAttributeOption['attribute_id'], ReqAttributeOption['selected']>>({})

watch(() => dataGetAttributesByCategory.value, () => {
  if (dataGetAttributesByCategory.value?.attributes) {
    // case update, init data
    if (attributesSelected) {
      attributesSelected.forEach((attr) => {
        const attribute = dataGetAttributesByCategory.value?.attributes.find(
          item => item.id === attr.attribute,
        )
        const selectedOption = attribute?.options?.find(option =>
          option.id === attr.selected || option.value === attr.selected,
        )

        state[attr.attribute] = selectedOption?.id ?? attr.selected
      })
    }
    else {
      dataGetAttributesByCategory.value.attributes.forEach((attr) => {
        state[attr.id] = ''
      })
    }
  }
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
    class="flex gap-4"
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
          class="w-full lg:w-52"
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
            class="absolute right-9 top-3 size-4 cursor-pointer text-zinc-400"
            @click="() => state[attr.id] = ''"
          />
        </div>
      </UFormGroup>
    </div>
  </div>
</template>
