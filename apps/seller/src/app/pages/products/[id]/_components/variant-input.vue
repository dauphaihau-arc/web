<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PRODUCT_CONFIG, ProductVariantTypes } from '@arc/enums/product'
import { productInventorySchema } from '@arc/schemas/product-inventory.schema'
import type { IOnChangeUpdateVariants } from './update-product-form.vue'
import type {
  DetailShopProductResponse,
} from '~/shared/api/shop/product/contracts/read.contract'
import type { UpdateProductBody, UpdateVariantOptions } from '~/shared/api/shop/product/contracts/form.contract'

type VariantEditorProduct = DetailShopProductResponse['product']

type VariantOption = { id: string, variant_name: string, errorMsg: string }

type State = {
  isActiveSubVariant: boolean
  variantOption: string
  subVariantOption: string
  errorVariantOption: string
  errorSubVariantOption: string
  errorVariantGroupName: string
  errorVariantSubGroupName: string
  variantIdsDelete: string[]
  variantsCurrent: Map<string, string>
} & Record<'variants' | 'subVariants', VariantOption[]>
& {
  variant_group_name?: string
  variant_sub_group_name?: string
}

type VariantTable = {
  id: number
  inventoryId?: string | null
  subVariantId?: string | null
  sub_variant_name?: string
  errorAmount: string
  errorStock: string
  isUpdated?: boolean
  amount?: number
  stock?: number
  sku?: string
  variant_name?: string
}

const generateRandomId = () => new Date().getTime().toString()

const props = defineProps<{
  countValidate: number
  product: VariantEditorProduct
}>()

const emit = defineEmits<{
  (e: 'onChange', value: IOnChangeUpdateVariants | null): void
  (e: 'isVariantsUpdated', value: number): void
}>()

const countStateChange = ref(0)

const state = reactive<State>({
  isActiveSubVariant: false,
  variantOption: '',
  subVariantOption: '',
  errorVariantGroupName: '',
  errorSubVariantOption: '',
  errorVariantSubGroupName: '',
  errorVariantOption: '',
  variants: [],
  subVariants: [],
  variantIdsDelete: [],
  variantsCurrent: new Map(),
})

const defaultVariantTable: VariantTable = {
  id: 1,
  variant_name: '',
  amount: undefined,
  stock: 0,
  sku: '',
  errorAmount: '',
  errorStock: '',
  inventoryId: null,
  isUpdated: false,
}

const variantsTable = ref<VariantTable[]>([defaultVariantTable])

onMounted(() => {
  if (props.product.variant_type === ProductVariantTypes.NONE) {
    return
  }
  const { variant_type, variant_group_name, variants } = props.product
  state.variants = variants.map((variant) => {
    state.variantsCurrent.set(variant.id, variant.variant_name)
    state.variantsCurrent.set(variant.variant_name, variant.id)
    return {
      id: variant.id,
      variant_name: variant.variant_name,
      errorMsg: '',
    }
  })

  if (variant_type === ProductVariantTypes.SINGLE) {
    state.variant_group_name = variant_group_name
    variantsTable.value = variants.map((variant, index) => ({
      id: index + 1,
      inventoryId: variant.inventory.id,
      variant_name: variant.variant_name || '',
      amount: variant.inventory.amount,
      stock: variant.inventory.stock,
      sku: variant.inventory?.sku || '',
      isUpdated: false,
      errorAmount: '',
      errorStock: '',
    }))
  }

  if (variant_type === ProductVariantTypes.COMBINE) {
    state.variant_group_name = variant_group_name
    state.variant_sub_group_name = props.product.variant_sub_group_name
    openSubVariant()
    state.subVariants = variants[0].variant_options.map((variantOpt) => {
      state.variantsCurrent.set(variantOpt.variant.id, variantOpt.variant.variant_name)
      state.variantsCurrent.set(variantOpt.variant.variant_name, variantOpt.variant.id)
      return {
        id: variantOpt.variant.id,
        variant_name: variantOpt.variant.variant_name,
        errorMsg: '',
      }
    })

    let id = 0
    const initVariantsTable: VariantTable[] = []
    variants.forEach((variant) => {
      variant.variant_options.forEach((variantOpt) => {
        id++
        initVariantsTable.push({
          id,
          variant_name: variant.variant_name || '',
          sub_variant_name: variantOpt.variant.variant_name || '',
          subVariantId: variantOpt.variant.id,
          inventoryId: variantOpt.inventory.id,
          amount: variantOpt.inventory.amount,
          stock: variantOpt.inventory.stock,
          sku: variantOpt.inventory?.sku || '',
          errorAmount: '',
          errorStock: '',
        })
      })
    })
    variantsTable.value = initVariantsTable
  }
})

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
        subVariantId: state.variantsCurrent.get(stateSubVariant.variant_name),
        inventoryId: result?.inventoryId || null,
        amount: result?.amount || undefined,
        stock: result?.stock || 0,
        sku: result?.sku || '',
        errorAmount: '',
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
  state.variantIdsDelete.push(id)
  state.variants = state.variants.filter(variant => variant.id !== id)
  variantsTable.value = variantsTable.value.filter(variant => variant.variant_name !== variant_name)
}

const removeSubVariant = ({ id, variant_name }: VariantOption) => {
  state.variantIdsDelete.push(id)
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
    key: 'amount',
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

const onChangeInputTable = (event: Event, row: VariantTable) => {
  const target = event.target as HTMLInputElement
  const name = target.name
  let value: string | number = target.value

  if (name === 'amount' || name === 'stock') {
    value = Number(value)
  }
  if (row.id) {
    variantsTable.value[row.id - 1][name] = value
    variantsTable.value[row.id - 1].isUpdated = true
  }
}

function openSubVariant() {
  state.isActiveSubVariant = true

  columns.value = insert(columns.value, {
    key: 'sub_variant_name',
    label: state.variant_sub_group_name || 'Group variant 2',
  }, 1)

  if (state.variants.length) {
    variantsTable.value = state.variants.map((variant) => {
      return {
        ...defaultVariantTable,
        variant_name: variant.variant_name,
        sub_variant_name: '',
      }
    })
  }
  else {
    variantsTable.value[0].sub_variant_name = ''
  }
}

const closeSubVariant = () => {
  state.isActiveSubVariant = false

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

  // validate amount, stock, sku in table
  const variantsTableForParse: Pick<VariantTable, 'amount' | 'stock' | 'sku'>[] = []
  variantsTable.value.forEach((vb) => {
    vb.errorAmount = ''
    vb.errorStock = ''
    const { stock, amount, sku } = vb
    variantsTableForParse.push({ stock, amount, sku })
  })

  const parsedVariantsTable = productInventorySchema
    .pick({ amount: true, stock: true, sku: true })
    .array()
    .safeParse(variantsTableForParse)

  if (!parsedVariantsTable.success) {
    parsedVariantsTable.error.issues.forEach((detail) => {
      const index = detail.path[0]
      const name = detail.path[1]
      if (name === 'amount') {
        variantsTable.value[index].errorAmount = detail.message
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
    emit('onChange', null)
  }
})

watch(() => [state, variantsTable.value], () => {
  countStateChange.value++
  if (countStateChange.value === 2) {
    emit('isVariantsUpdated', countStateChange.value)
  }
}, { deep: true })

function emitData() {
  const variant_inventories: UpdateProductBody['variant_inventories'] = []
  const new_single_variants: UpdateProductBody['new_single_variants'] = []
  const update_variants: UpdateProductBody['update_variants'] = []
  let new_combine_variants: UpdateProductBody['new_combine_variants'] = []

  // add new variant ( case combine variant )
  if (state.isActiveSubVariant) {
    new_combine_variants = Object.entries<UpdateVariantOptions[]>(
      variantsTable.value
        .filter(variant => !variant.inventoryId)
        .reduce((acc, variant) => {
          const {
            amount, sku, stock, variant_name, sub_variant_name, subVariantId,
          } = variant

          if (!acc[variant_name]) {
            acc[variant_name] = []
          }
          acc[variant_name].push({
            amount,
            sku,
            stock,
            variant: subVariantId,
            variant_name: sub_variant_name,
          })
          return acc
        }, {}),
    ).map(([variant_name, variant_options]) => ({
      variant_name,
      variant_options,
    }))
  }

  // update inventory or add new variant ( single variant )
  variantsTable.value.forEach((variant) => {
    const {
      isUpdated, inventoryId, amount, stock, sku, variant_name,
    } = variant

    if (!amount) {
      return
    }

    if (isUpdated && inventoryId) {
      variant_inventories.push({
        id: inventoryId,
        amount,
        stock,
        sku: sku || '',
      })
    }
    if (!state.isActiveSubVariant && !inventoryId) {
      new_single_variants.push({
        variant_name,
        amount,
        stock,
        sku: sku || '',
      })
    }
  })

  // update variant name
  state.variants.forEach((variant) => {
    if (state.variantsCurrent.has(variant.id)) {
      if (state.variantsCurrent.get(variant.id) !== variant.variant_name) {
        update_variants.push({
          id: variant.id,
          variant_name: variant.variant_name,
        })
      }
    }
  })

  // update sub variant name
  if (state.isActiveSubVariant) {
    state.subVariants.forEach((variant) => {
      if (
        state.variantsCurrent.has(variant.id)
        && state.variantsCurrent.get(variant.id) !== variant.variant_name
      ) {
        update_variants.push({
          id: variant.id,
          variant_name: variant.variant_name,
        })
      }
    })
  }

  // delete variant + inv
  if (state.variantIdsDelete.length > 0) {
    state.variantIdsDelete.forEach((id) => {
      if (state.variantsCurrent.has(id)) {
        update_variants.push({ id })
      }
    })
  }

  if (state.isActiveSubVariant && state.variant_group_name && state.variant_sub_group_name) {
    emit('onChange', {
      variant_type: ProductVariantTypes.COMBINE,
      variant_group_name: state.variant_group_name,
      variant_sub_group_name: state.variant_sub_group_name,
      update_variants,
      variant_inventories,
      new_single_variants,
      new_combine_variants,
    })
  }
  else if (state.variant_group_name) {
    emit('onChange', {
      variant_type: ProductVariantTypes.SINGLE,
      variant_group_name: state.variant_group_name,
      update_variants,
      variant_inventories,
      new_single_variants,
      new_combine_variants,
    })
  }
  // emit('onChange', {
  //   variant_type: state.isActiveSubVariant ? ProductVariantTypes.COMBINE : ProductVariantTypes.SINGLE,
  //   variant_group_name: state.variant_group_name,
  //   variant_sub_group_name: state.variant_sub_group_name,
  //   update_variants,
  //   variant_inventories,
  //   new_single_variants,
  //   new_combine_variants,
  // });
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

      <template #amount-data="{ row }">
        <UFormGroup
          class="mt-6"
          :error="row.errorAmount ?? ''"
        >
          <UInput
            v-model.number="row.amount"
            v-max-number="PRODUCT_CONFIG.MAX_PRICE"
            v-numeric
            size="lg"
            name="amount"
            @input="(e: Event) => onChangeInputTable(e, row)"
          >
            <template #trailing>
              <span class="text-xs text-text-muted">USD</span>
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
            v-numeric
            v-max-number="PRODUCT_CONFIG.MAX_STOCK"
            name="stock"
            size="lg"
            @input="(e: Event) => onChangeInputTable(e, row)"
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
            v-uppercase
            :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
            name="sku"
            size="lg"
            @input="(e: Event) => onChangeInputTable(e, row)"
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

<style scoped lang="postcss">
.hint-text-input {
  @apply text-text-muted text-xs;
}

.error-message {
  @apply mt-2 text-state-danger-text text-sm h-[18px];
}
</style>
