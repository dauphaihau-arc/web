<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import ImagesInput from './images-input.vue'
import VariantInput from './variant-input.vue'
import {
  applyDetailProductToFormState,
  hasRemovedAllImages,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper'
import { useUpdateProductSubmit } from './use-update-product-submit'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { updateProductFormSchema } from '~/shared/schemas/forms/shop/product/update-product-form.schema'
import {
  ProductVariantTypes, PRODUCT_CONFIG,
  productWhoMadeOpts,
} from '~/shared/config/enums/product'
import { ROUTES } from '~/shared/config/enums/routes'
import FormGroupCard from '~/app/components/account/shop/wrapper-form-group-card.vue'
import NoneVariantInput from '~/app/components/account/shop/products/none-variant-input.vue'
import SearchCategoryInput from '~/app/components/account/shop/products/search-category-input.vue'
import SelectAttributesInput from '~/app/components/account/shop/products/select-attributes-input.vue'
import TagsInput from '~/app/components/account/shop/products/tags-input.vue'
import { useShopGetDetailProduct } from '~/shared/server-state/shop/product/detail.query'
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/shared/api/shop/product/contracts/form.contract'

export type IOnChangeUpdateVariants = Partial<Pick<UpdateProductBody,
  'update_variants' | 'variant_inventories' |
  'new_single_variants' | 'variant_type' | 'new_combine_variants'
>> & {
  variant_group_name?: string
  variant_sub_group_name?: string
} | null

const route = useRoute()
const queryClient = useQueryClient()

const productId = route.params.id as string

const {
  data: dataDetailProduct,
} = useShopGetDetailProduct(productId)

const noneVariant = reactive<Partial<NoneVariant>>({
  variant_type: ProductVariantTypes.NONE,
})

const stateSubmit = reactive<UpdateProductBody>({})

const formRef = ref()
const isVariantProduct = computed(() => stateSubmit.variant_type !== ProductVariantTypes.NONE)
const btnSubmit = ref()
const disabledButtonSubmit = ref(true)
const isVariantInputValid = ref(true)
const countValidate = ref(0)
const countValidateInputs = ref(0)
const countValidateVariantsInputs = ref(0)

const fileImages = ref<File[]>([])
const idsImageForDelete = ref<Required<Pick<ProductImageReference, 'id'>>[]>([])

const {
  loadingSubmit,
  submit,
} = useUpdateProductSubmit({
  productId,
  queryClient,
  dataDetailProduct,
  fileImages,
  idsImageForDelete,
})

const onChangeVariants = (values: IOnChangeUpdateVariants) => {
  isVariantInputValid.value = Boolean(values)
  if (!values) return

  Object.keys(values).forEach((key) => {
    if (!values[key]) {
      return
    }
    if (Array.isArray(values[key]) && values[key].length === 0) {
      return
    }
    stateSubmit[key] = values[key]
  })
}

const onChangeVariantType = () => {
  isVariantProduct.value = !isVariantProduct.value
  stateSubmit.variant_type = isVariantProduct.value ? ProductVariantTypes.SINGLE : ProductVariantTypes.NONE
}

const validateForm = (values: UpdateProductBody): FormError[] => {
  let errors: FormError[] = []
  countValidate.value++

  const result = updateProductFormSchema.safeParse(values)

  if (!result.success) {
    errors = result.error.issues.map((detail) => {
      const path = detail.path.at(-1)
      return {
        path: typeof path === 'string' ? path : '',
        message: detail.message,
      }
    })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<UpdateProductBody>) {
  if (isVariantProduct.value && !isVariantInputValid.value) return

  const dataSubmit = pruneUnchangedUpdateFields(
    { ...event.data },
    dataDetailProduct.value?.product,
  )

  await submit(dataSubmit)
}

function onError(event: FormErrorEvent) {
  const element = document.getElementById(event.errors[0].id)
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(() => dataDetailProduct.value, () => {
  const detailProduct = dataDetailProduct.value?.product
  if (detailProduct) {
    applyDetailProductToFormState(detailProduct, stateSubmit, noneVariant)
  }
}, { immediate: true })

watch(() => stateSubmit.category_id, () => {
  stateSubmit.attributes = []
})

watchDebounced(
  () => [stateSubmit, fileImages.value, idsImageForDelete.value, countValidateVariantsInputs.value],
  () => {
    countValidateInputs.value++

    const result = updateProductFormSchema.safeParse(stateSubmit)

    const isEmptyImages = hasRemovedAllImages(
      idsImageForDelete.value,
      fileImages.value,
      dataDetailProduct.value?.product,
    )

    disabledButtonSubmit.value = countValidateInputs.value === 1
    || !result.success
    || isEmptyImages
    || countValidateVariantsInputs.value === 1
  },
  { debounce: 500, maxWait: 1000, deep: true },
)
</script>

<template>
  <UForm
    ref="formRef"
    :validate-on="['submit']"
    :validate="validateForm"
    :state="stateSubmit"
    class="space-y-7"
    @error="onError"
    @submit="onSubmit"
  >
    <FormGroupCard>
      <template #title>
        Basic info
      </template>
      <template #content>
        <ImagesInput
          v-model:new-file-images="fileImages"
          v-model:ids-image-delete="idsImageForDelete"
          class="mb-4"
          :images="dataDetailProduct?.product.images"
          :loading="loadingSubmit"
          :count-validate="countValidate"
        />
        <UFormGroup
          label="Title"
          name="title"
          class="mb-4"
          description="Include keywords that buyers would use to search for your product."
          required
        >
          <UInput
            v-model="stateSubmit.title"
            :disabled="loadingSubmit"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          label="Description"
          name="description"
          :help="stateSubmit.description
            && `${stateSubmit.description.length}/${PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION}`
          "
          required
        >
          <UTextarea
            v-model="stateSubmit.description"
            autoresize
            :maxlength="PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION"
            :rows="5"
            :disabled="loadingSubmit"
            size="lg"
          />
        </UFormGroup>
      </template>
    </FormGroupCard>

    <FormGroupCard>
      <template #title>
        Details
      </template>
      <template #subtitle>
        Share a few more specifics about your product to make
        it easier to find in search, and to help buyers know what
        to expect.
      </template>
      <template #content>
        <div class="grid grid-cols-4 gap-4">
          <UFormGroup
            label="Who made it?"
            name="who_made"
            class="mb-4"
            required
          >
            <USelectMenu
              v-model="stateSubmit.who_made"
              size="lg"
              :options="productWhoMadeOpts"
              value-attribute="id"
            />
          </UFormGroup>
        </div>

        <SearchCategoryInput
          v-model="stateSubmit.category_id"
          :category="dataDetailProduct?.product.category"
          :title="stateSubmit.title"
        />

        <SelectAttributesInput
          :key="stateSubmit.category_id"
          v-model="stateSubmit.attributes"
          :category_id="stateSubmit.category_id || dataDetailProduct?.product.category.id"
          :attributes-selected="dataDetailProduct?.product.attributes"
        />

        <TagsInput v-model="stateSubmit.tags" />
      </template>
    </FormGroupCard>

    <FormGroupCard>
      <template #title>
        Inventory and pricing
      </template>
      <template #content>
        <div class="">
          <UButton
            class="mb-4"
            color="gray"
            variant="solid"
            @click="onChangeVariantType"
          >
            {{ !isVariantProduct ? 'Add variations' : 'Remove variations' }}
          </UButton>

          <VariantInput
            v-if="isVariantProduct && dataDetailProduct"
            :product="dataDetailProduct.product"
            :count-validate="countValidate"
            @on-change="onChangeVariants"
            @is-variants-updated="(count) => countValidateVariantsInputs = count"
          />
          <NoneVariantInput
            v-else
            v-model:none-variant="noneVariant"
            class="max-w-[40%]"
          />
        </div>
      </template>
    </FormGroupCard>

    <button
      ref="btnSubmit"
      type="submit"
      class="hidden"
    />
  </UForm>

  <div class="fixed-actions-form">
    <UButton
      :disabled="loadingSubmit"
      size="md"
      color="gray"
      :to="`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}`"
    >
      Cancel
    </UButton>
    <UButton
      :loading="loadingSubmit"
      size="md"
      type="submit"
      @click="() => btnSubmit.click()"
    >
      Update
    </UButton>
  </div>
</template>

<style scoped>
@import url("~/app/assets/css/layout-shop.css");
</style>
