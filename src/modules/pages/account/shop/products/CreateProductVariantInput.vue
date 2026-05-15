<script setup lang="ts">
import type { ProductCombineVariant, ProductInventory, ProductVariant } from '~/shared/types/product'
import { PRODUCT_CONFIG, PRODUCT_VARIANT_TYPES } from '~/shared/config/enums/product'
import { productInventorySchema } from '~/shared/schemas/product-inventory.schema'
import type {
  StateCombineVariant,
  StateSingleVariant,
} from '~/shared/types/request-api/shop-product'
import type { NoUndefinedField } from '~/shared/types/utils'

const props = defineProps<{ countValidate: number }>()

const generateRandomId = () => new Date().getTime()

type VariantOption = { id: number, variant_name: string, errorMsg: string }

type State = {
  isActiveSubVariant: boolean
  variantOption: string
  subVariantOption: string
  errorVariantOption: string
  errorSubVariantOption: string
  errorVariantGroupName: string
  errorVariantSubGroupName: string
} & Pick<ProductCombineVariant, 'variant_group_name' | 'variant_sub_group_name'>
& Record<'variants' | 'subVariants', VariantOption[]>

type VariantTable = {
  id: number
  sub_variant_name?: string
  errorPrice: string
  errorStock: string
  price?: ProductInventory['price']
} & Pick<ProductVariant, 'variant_name'> &
Pick<ProductInventory, | 'stock' | 'sku'>

const singleVariantModel = defineModel<StateSingleVariant>('singleVariant', {
  default: {},
})

const combineVariantModel = defineModel<StateCombineVariant>('combineVariant', {
  default: {},
})

const variantTypeModel = defineModel<PRODUCT_VARIANT_TYPES>('variantType', {
  default: PRODUCT_VARIANT_TYPES.SINGLE,
})

const state = reactive<State>({
  variant_group_name: '',
  variant_sub_group_name: '',
  isActiveSubVariant: false,
  variantOption: '',
  errorVariantGroupName: '',
  errorSubVariantOption: '',
  errorVariantSubGroupName: '',
  errorVariantOption: '',
  subVariantOption: '',
  variants: [],
  subVariants: [],
})

const defaultVariantTable: VariantTable = {
  id: 1,
  variant_name: '',
  price: undefined,
  stock: 0,
  sku: '',
  errorPrice: '',
  errorStock: '',
}

const variantsTable = ref<VariantTable[]>([defaultVariantTable])

function mixVariantsTable() {
  let id = 0
  const newVariantsTable: VariantTable[] = []
  state.variants.forEach((stateVariant) => {
    state.subVariants.forEach((stateSubVariant) => {
      id++
      const result = variantsTable.value.find(
        variant => variant.variant_name === stateVariant.variant_name
          && variant.sub_variant_name === stateSubVariant.variant_name,
      )
      newVariantsTable.push({
        id,
        variant_name: stateVariant.variant_name || '',
        sub_variant_name: stateSubVariant.variant_name || '',
        price: result?.price || undefined,
        stock: result?.stock || 0,
        sku: result?.sku || '',
        errorPrice: '',
        errorStock: '',
      })
    })
  })
  variantsTable.value = newVariantsTable
}

const addVariant = () => {
  state.variants.push({ id: generateRandomId(), variant_name: state.variantOption, errorMsg: '' })

  // case add variant_name into first element table
  if (variantsTable.value.length === 1 && !variantsTable.value[0].variant_name) {
    variantsTable.value[0].variant_name = state.variantOption
    state.variantOption = ''
    return
  }

  // case variantsTable.value.length > 0, add new element into table
  if (!state.subVariants.length) {
    const newVariantTable = {
      ...defaultVariantTable,
      id: variantsTable.value.length + 1,
      variant_name: state.variantOption,
    }

    if (state.isActiveSubVariant) {
      newVariantTable.sub_variant_name = ''
    }
    variantsTable.value.push(newVariantTable)
    state.variantOption = ''
    return
  }

  // case mix variants & subVariants option into table
  mixVariantsTable()
  state.variantOption = ''
}

const addSubVariant = () => {
  state.subVariants.push({ id: generateRandomId(), variant_name: state.subVariantOption, errorMsg: '' })

  // case add variant_name into first element table at sub variant column
  if (!variantsTable.value[0].sub_variant_name && variantsTable.value.length === 1) {
    variantsTable.value[0].sub_variant_name = state.subVariantOption
    state.subVariantOption = ''
    return
  }

  // case variantsTable.value.length > 0, add new element into table
  if (!state.variants.length) {
    const newVariants: VariantTable[] = []
    state.subVariants.forEach((subVariant, index) => {
      newVariants.push({
        ...defaultVariantTable,
        id: index + 1,
        sub_variant_name: subVariant.variant_name,
      })
    })
    variantsTable.value = newVariants
    state.subVariantOption = ''
    return
  }

  // case mix variants & subVariants option into table
  mixVariantsTable()
  state.subVariantOption = ''
}

const removeVariant = ({ id, variant_name }: VariantOption) => {
  state.variants = state.variants.filter(variant => variant.id !== id)
  variantsTable.value = variantsTable.value.filter(variant => variant.variant_name !== variant_name)
}

const removeSubVariant = ({ id, variant_name }: VariantOption) => {
  state.subVariants = state.subVariants.filter(variant => variant.id !== id)
  variantsTable.value = variantsTable.value.filter((variant) => {
    return variant.sub_variant_name !== variant_name
  })
}

const updateVariantName = (currentVariant: VariantOption, e: Event) => {
  const { id, variant_name } = currentVariant
  const newVariantName = (e.target as HTMLInputElement).value

  state.variants = state.variants.map((variant) => {
    if (variant.id === id) {
      return { ...variant, variant_name: newVariantName }
    }
    return variant
  })

  variantsTable.value = variantsTable.value.map((variant) => {
    if (variant.variant_name === variant_name) {
      return { ...variant, variant_name: newVariantName }
    }
    return variant
  })
}

const updateSubVariantName = (currentVariant: VariantOption, e: Event) => {
  const { id, variant_name } = currentVariant
  const newSubVariantName = (e.target as HTMLInputElement).value
  state.subVariants = state.subVariants.map((variant) => {
    if (variant.id === id) {
      return { ...variant, variant_name: newSubVariantName }
    }
    return variant
  })
  variantsTable.value = variantsTable.value.map((variant) => {
    if (variant.sub_variant_name === variant_name) {
      return { ...variant, sub_variant_name: newSubVariantName }
    }
    return variant
  })
}

const columnsRef = ref([
  {
    key: 'variant_name',
    label: state.variant_group_name || 'Group variant 1',
  }, {
    key: 'price',
    label: 'Price',
  }, {
    key: 'stock',
    label: 'Stock',
  }, {
    key: 'sku',
    label: 'SKU',
  },
])

const columns = computed({
  get() {
    return columnsRef.value
  },
  set(val) {
    columnsRef.value = val
  },
})

const openSubVariant = () => {
  state.isActiveSubVariant = true
  variantTypeModel.value = PRODUCT_VARIANT_TYPES.COMBINE

  columns.value = insert(columns.value, {
    key: 'sub_variant_name',
    label: 'Group variant 2',
  }, 1)

  if (state.variants.length) {
    variantsTable.value = state.variants.map((variant) => {
      return { ...defaultVariantTable, variant_name: variant.variant_name, sub_variant_name: '' }
    })
  }
  else {
    variantsTable.value[0].sub_variant_name = ''
  }
}

const closeSubVariant = () => {
  state.isActiveSubVariant = false
  variantTypeModel.value = PRODUCT_VARIANT_TYPES.SINGLE

  columns.value = columns.value.filter(col => col.key !== 'sub_variant_name')

  if (state.variants.length) {
    variantsTable.value = state.variants.map((variant, index) => {
      return {
        ...defaultVariantTable,
        id: index + 1,
        variant_name: variant.variant_name,
      }
    })
  }
  else {
    variantsTable.value[0].variant_name = ''
  }
}

const rowsTable = computed(() => variantsTable.value)

watch(() => [state.variant_group_name, state.variant_sub_group_name], () => {
  columns.value[0].label = state.variant_group_name || 'Group variant 1'
  if (state.isActiveSubVariant) {
    columns.value[1].label = state.variant_sub_group_name || 'Group variant 2'
  }
})

watch(() => props.countValidate, () => {
  state.errorVariantGroupName = !state.variant_group_name ? 'Required' : ''
  state.errorVariantOption = state.variants.length === 0 ? 'Required at least 1 variant' : ''
  if (state.isActiveSubVariant) {
    state.errorVariantSubGroupName = !state.variant_sub_group_name ? 'Required' : ''
    state.errorSubVariantOption = state.subVariants.length === 0 ? 'Required at least 1 variant' : ''
  }

  // validate duplicate variant name
  const variantNameMap = new Map<string, number>()
  const errorMsg = 'Duplicate'
  let isAnyDuplicateVariantName = false
  state.variants.forEach((variant, idx) => {
    variant.errorMsg = ''
    const isHasVariantName = variantNameMap.has(variant.variant_name)

    if (!isHasVariantName) {
      variantNameMap.set(variant.variant_name, idx)
    }
    else {
      const indexInMap = variantNameMap.get(variant.variant_name)
      variant.errorMsg = errorMsg
      isAnyDuplicateVariantName = true
      if (indexInMap || indexInMap === 0) {
        state.variants[indexInMap].errorMsg = errorMsg
      }
    }
  })

  // validate price, stock, sku in table
  const variantsTableForParse: Pick<VariantTable, 'price' | 'stock' | 'sku'>[] = []
  variantsTable.value.forEach((vb) => {
    vb.errorPrice = ''
    vb.errorStock = ''
    const { stock, price, sku } = vb
    variantsTableForParse.push({ stock, price, sku })
  })

  const parsedVariantsTable = productInventorySchema
    .pick({ price: true, stock: true, sku: true })
    .array()
    .safeParse(variantsTableForParse)

  if (!parsedVariantsTable.success) {
    parsedVariantsTable.error.issues.forEach((detail) => {
      const index = detail.path[0] as number
      const name = detail.path[1]
      if (name === 'price') {
        variantsTable.value[index].errorPrice = detail.message
      }
      if (name === 'stock') {
        variantsTable.value[index].errorStock = detail.message
      }
    })
  }

  if (
    state.variants.length > 0
    && (state.isActiveSubVariant ? state.subVariants.length > 0 : true)
    && !isAnyDuplicateVariantName
    && parsedVariantsTable.success
  ) {
    emitData()
  }
  else {
    singleVariantModel.value.variant_options = undefined
    combineVariantModel.value.variant_options = undefined
  }
})

function emitData() {
  if (state.isActiveSubVariant) {
    const variantsTableAsObj = variantsTable.value.reduce((acc, variant) => {
      const {
        price, sku, stock, variant_name, sub_variant_name,
      } = variant as NoUndefinedField<VariantTable>
      if (!acc[variant_name]) {
        acc[variant_name] = []
      }
      acc[variant_name].push({
        price,
        sku,
        stock,
        variant_name: sub_variant_name,
      })
      return acc
    }, {} as Record<ProductVariant['variant_name'], Pick<NoUndefinedField<VariantTable>, 'price' | 'sku' | 'stock' | 'variant_name'>[]>)

    const combineVariants = Object.entries(variantsTableAsObj).map(([variant_name, variant_options]) => ({
      variant_name,
      variant_options,
    }))

    combineVariantModel.value.variant_group_name = state.variant_group_name
    combineVariantModel.value.variant_sub_group_name = state.variant_sub_group_name
    combineVariantModel.value.variant_options = combineVariants
  }
  else {
    const variantOptions = variantsTable.value.map((vb) => {
      const {
        price, sku, stock, variant_name,
      } = vb as NoUndefinedField<VariantTable>
      return {
        price, sku, stock, variant_name,
      }
    })
    singleVariantModel.value.variant_group_name = state.variant_group_name
    singleVariantModel.value.variant_options = variantOptions
  }
}

watchDebounced(
  () => state.variantOption,
  () => {
    state.errorVariantOption = ''
    if (state.variants.length > 0) {
      state.variants.forEach((variant) => {
        variant.errorMsg = ''
        if (variant.variant_name === state.variantOption) {
          variant.errorMsg = 'Duplicate'
          state.errorVariantOption = 'Duplicate'
        }
      })
    }
  },
  { debounce: 500, maxWait: 1000 },
)

watchDebounced(
  () => state.subVariantOption,
  () => {
    state.errorSubVariantOption = ''
    if (state.subVariants.length > 0) {
      state.subVariants.forEach((variant) => {
        variant.errorMsg = ''
        if (variant.variant_name === state.subVariantOption) {
          variant.errorMsg = 'Duplicate'
          state.errorSubVariantOption = 'Duplicate'
        }
      })
    }
  },
  { debounce: 500, maxWait: 1000 },
)
</script>

<template>
  <div>
    <div class="flex gap-20">
      <!--   Group variant 1   -->
      <div class="w-1/5">
        <UFormGroup
          class="mb-4"
          label="Group variant 1"
          required
          :error="state.errorVariantGroupName ?? ''"
        >
          <template #hint>
            <span class="hint-text-input">
              {{ state.variant_group_name?.length ?? 0 }}/
              {{ PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME }}
            </span>
          </template>
          <UInput
            v-model="state.variant_group_name"
            :maxlength="PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup
          class="mb-4"
          label="Name the option"
          required
          :error="state.errorVariantOption ?? ''"
        >
          <template #hint>
            <span class="hint-text-input">
              {{ state.variantOption.length ?? 0 }}/
              {{ PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME }}
            </span>
          </template>

          <UButtonGroup
            size="lg"
            orientation="horizontal"
          >
            <UInput
              v-model="state.variantOption"
              :maxlength="PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME"
            />
            <!--              :disabled="!state.variantOption" -->
            {{ state.errorVariantOption }}
            <UButton
              :disabled="!state.variantOption || !!state.errorVariantOption"
              color="gray"
              variant="solid"
              @click="addVariant"
            >
              Add
            </UButton>
          </UButtonGroup>
        </UFormGroup>

        <div v-if="state.variants.length > 0">
          <div
            v-for="option of state.variants"
            :key="option.id"
          >
            <UFormGroup
              :error="option?.errorMsg ?? ''"
              class="mb-4"
            >
              <UButtonGroup
                v-if="option"
                size="lg"
                orientation="horizontal"
              >
                <UInput
                  :model-value="option.variant_name"
                  :maxlength="PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME"
                  @change="(e: Event) => updateVariantName(option, e)"
                />

                <UButton
                  :disabled="state.variants.length === 1"
                  icon="i-heroicons-x-mark"
                  color="gray"
                  @click="() => removeVariant(option)"
                />
              </UButtonGroup>
            </UFormGroup>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <UDivider
          color="gray"
          orientation="vertical"
          class="w-fit"
        />
      </div>

      <!--   Group variant 2   -->
      <div class="relative w-1/5">
        <UButton
          v-if="!state.isActiveSubVariant"
          class="mb-4"
          icon="i-heroicons-plus"
          color="gray"
          variant="solid"
          @click="openSubVariant"
        >
          Add a variation
        </UButton>
        <div v-else>
          <UButton
            class="absolute -right-20 -top-4"
            variant="ghost"
            icon="i-heroicons-x-mark"
            color="gray"
            @click="closeSubVariant"
          />

          <UFormGroup
            class="mb-4"
            label="Group variant 2"
            required
            name="variant_sub_group_name"
            :error="state.errorVariantSubGroupName ?? ''"
          >
            <UInput
              v-model="state.variant_sub_group_name"
              size="lg"
              :maxlength="PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME"
            />
            <template #hint>
              <span class="hint-text-input">
                {{ state.variant_sub_group_name?.length ?? 0 }}/
                {{ PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME }}
              </span>
            </template>
          </UFormGroup>
          <UFormGroup
            class="mb-4"
            label="Name the option"
            required
            :error="state.errorSubVariantOption ?? ''"
          >
            <template #hint>
              <span class="hint-text-input">
                {{ state.subVariantOption.length ?? 0 }}/
                {{ PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME }}
              </span>
            </template>
            <UButtonGroup
              size="lg"
              orientation="horizontal"
            >
              <UInput v-model="state.subVariantOption" />

              <UButton
                :disabled="!state.subVariantOption || !!state.errorSubVariantOption"
                color="gray"
                variant="solid"
                @click="addSubVariant"
              >
                Add
              </UButton>
            </UButtonGroup>
          </UFormGroup>

          <div v-if="state.subVariants.length > 0">
            <div
              v-for="option of state.subVariants"
              :key="option.id"
            >
              <UFormGroup
                :error="option?.errorMsg ?? ''"
                class="mb-4"
              >
                <UButtonGroup
                  v-if="option"
                  size="lg"
                  orientation="horizontal"
                >
                  <UInput
                    :model-value="option.variant_name"
                    @change="(e: Event) => updateSubVariantName(option, e)"
                  />
                  <UButton
                    :disabled="state.subVariants.length === 1"
                    icon="i-heroicons-x-mark"
                    color="gray"
                    @click="() => removeSubVariant(option)"
                  />
                </UButtonGroup>
              </UFormGroup>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UTable
      :rows="rowsTable"
      :columns="columns"
      class="mt-5"
      :ui="{
        th: { base: 'max-w-28 truncate' },
      }"
    >
      <template #variant_name-data="{ row }">
        <div class="min-w-44 max-w-44 truncate">
          {{ row.variant_name || '-' }}
        </div>
      </template>

      <template #sub_variant_name-data="{ row }">
        <div class="min-w-44 max-w-44 truncate">
          {{ row.sub_variant_name || '-' }}
        </div>
      </template>

      <template #price-data="{ row }">
        <UFormGroup
          class="mt-6"
          :error="row.errorPrice ?? ''"
        >
          <UInput
            v-model.number="row.price"
            v-max-number="PRODUCT_CONFIG.MAX_PRICE"
            v-numeric
            size="lg"
            name="price"
          >
            <template #trailing>
              <span class="text-xs text-gray-500 dark:text-gray-400">USD</span>
            </template>
          </UInput>
          <template #error="{ error }">
            <p class="error-message">
              {{ error ?? '' }}
            </p>
          </template>
        </UFormGroup>
      </template>

      <template #stock-data="{ row }">
        <UFormGroup
          class="mt-6"
          :error="row.errorStock ?? ''"
        >
          <UInput
            v-model.number="row.stock"
            v-max-number="PRODUCT_CONFIG.MAX_STOCK"
            v-numeric
            name="stock"
            size="lg"
          />
          <template #error="{ error }">
            <p class="error-message">
              {{ error ?? '' }}
            </p>
          </template>
        </UFormGroup>
      </template>

      <template #sku-data="{ row }">
        <UFormGroup class="mt-6">
          <UInput
            v-model="row.sku"
            v-alphanumeric
            :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
            name="sku"
            size="lg"
            :ui="{ base: 'uppercase' }"
          />
          <template #error="{ error }">
            <p class="error-message">
              {{ error ?? '' }}
            </p>
          </template>
        </UFormGroup>
      </template>
    </UTable>
  </div>
</template>

<style scoped>
.hint-text-input {
  @apply text-gray-500 text-xs;
}

.error-message {
  @apply mt-2 text-red-500 dark:text-red-400 text-sm h-[18px];
}
</style>
