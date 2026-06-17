<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ProductStates,
  ProductVariantTypes, PRODUCT_CONFIG,
  productWhoMadeOpts,
} from '@arc/enums/product'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import NoneVariantInput from '../../_components/none-variant-input.vue'
import ProductFormSectionNav from '../../_components/product-form-section-nav.vue'
import SearchCategoryInput from '../../_components/search-category-input.vue'
import SelectAttributesInput from '../../_components/select-attributes-input.vue'
import TagsInput from '../../_components/tags-input.vue'
import ImagesInput from './images-input.vue'
import VariantInput from './variant-input.vue'
import {
  applyDetailProductToFormState,
  hasRemovedAllImages,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper'
import {
  useUpdateProductSubmit,
  type UpdateProductAction,
} from './use-update-product-submit'
import { updateProductFormSchema } from '~/shared/schemas/forms/shop/product/update-product-form.schema'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import FormGroupCard from '~/app/components/wrapper-form-group-card.vue'
import { routes } from '~/shared/navigation/routes'
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

const sections = [
  { id: 'product-basic-info', label: 'Basic info' },
  { id: 'product-details', label: 'Details' },
  { id: 'product-inventory', label: 'Inventory' },
]

const fileImages = ref<File[]>([])
const idsImageForDelete = ref<Required<Pick<ProductImageReference, 'id'>>[]>([])
const pendingAction = ref<UpdateProductAction>('save')

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

const productState = computed(() => dataDetailProduct.value?.product.state)

const currentImageCount = computed(() => {
  const product = dataDetailProduct.value?.product

  if (!product) {
    return fileImages.value.length
  }

  const deletedImageIds = new Set(idsImageForDelete.value.map(image => image.id))

  return product.images.filter(image => !deletedImageIds.has(image.id)).length
    + fileImages.value.length
})

const canPublishFromDetail = computed(() =>
  [ProductStates.DRAFT, ProductStates.INACTIVE].includes(productState.value as ProductStates),
)

const canDeactivateFromDetail = computed(() =>
  productState.value === ProductStates.ACTIVE,
)

const publishImageError = computed(() =>
  canPublishFromDetail.value && currentImageCount.value === 0
    ? 'Add at least 1 image before publishing.'
    : '',
)

function stateTone(state?: ProductStates) {
  switch (state) {
    case ProductStates.ACTIVE:
      return 'green'
    case ProductStates.INACTIVE:
      return 'yellow'
    case ProductStates.DRAFT:
      return 'gray'
    default:
      return 'gray'
  }
}

function formatStateLabel(state?: ProductStates) {
  if (!state) {
    return 'Unknown'
  }

  return state.charAt(0).toUpperCase() + state.slice(1)
}

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

  await submit(dataSubmit, pendingAction.value)
  pendingAction.value = 'save'
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
  <div>
    <ProductFormSectionNav :sections="sections" />

    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :validate="validateForm"
      :state="stateSubmit"
      class="space-y-7"
      @error="onError"
      @submit="onSubmit"
    >
      <section
        id="product-basic-info"
        class="scroll-mt-24"
      >
        <FormGroupCard>
          <template #title>
            Basic info
          </template>
          <template #content>
            <div class="mb-4 flex items-center gap-3">
              <span class="text-sm text-text-muted">Status</span>
              <StatusBadge
                :color="stateTone(productState)"
                size="sm"
              >
                {{ formatStateLabel(productState) }}
              </StatusBadge>
            </div>
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
              class="mb-4 form-field-constrained"
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
              class="form-field-constrained"
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
      </section>

      <section
        id="product-inventory"
        class="scroll-mt-24"
      >
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
      </section>

      <section
        id="product-details"
        class="scroll-mt-24"
      >
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
      </section>

      <button
        ref="btnSubmit"
        type="submit"
        class="hidden"
      />
    </UForm>

    <FixedFormActions>
      <UButton
        :disabled="loadingSubmit"
        size="md"
        color="gray"
        :to="routes.products()"
      >
        Cancel
      </UButton>
      <UButton
        :loading="loadingSubmit"
        :disabled="disabledButtonSubmit"
        size="md"
        type="submit"
        @click="() => {
          pendingAction = 'save';
          btnSubmit.click();
        }"
      >
        Update
      </UButton>
      <UButton
        v-if="canPublishFromDetail"
        :loading="loadingSubmit"
        :disabled="disabledButtonSubmit || !!publishImageError"
        size="md"
        color="emerald"
        type="submit"
        @click="() => {
          pendingAction = 'publish';
          btnSubmit.click();
        }"
      >
        Save & publish
      </UButton>
      <UButton
        v-if="canDeactivateFromDetail"
        :loading="loadingSubmit"
        :disabled="disabledButtonSubmit"
        size="md"
        color="amber"
        variant="soft"
        type="submit"
        @click="() => {
          pendingAction = 'deactivate';
          btnSubmit.click();
        }"
      >
        Save & deactivate
      </UButton>
    </FixedFormActions>
    <p
      v-if="publishImageError"
      class="mt-3 text-sm text-state-danger-text"
    >
      {{ publishImageError }}
    </p>
  </div>
</template>
