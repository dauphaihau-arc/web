<script setup lang="ts">
import {
  isDigitalOpts,
  PRODUCT_CONFIG,
  ProductStates,
  ProductVariantTypes,
  productWhoMadeOpts,
} from '@arc/enums/product'
import CreateShippingProductDialog from '../create-shipping-product-dialog/create-shipping-product-dialog.vue'
import NoneVariantInput from '../none-variant-input.vue'
import SearchCategoryInput from '../search-category-input.vue'
import SelectAttributesInput from '../select-attributes-input.vue'
import TagsInput from '../tags-input.vue'
import ImagesInput from './images-input.vue'
import VariantInput from './variant-input.vue'
import { useCreateProductSubmit } from './use-create-product-submit'
import {
  createProductFormSchema,
  createProductInventoryFormSchema,
} from '~/shared/schemas/forms/shop/product/create-product-form.schema'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { ROUTES } from '~/shared/config/enums/routes'
import FormGroupCard from '~/app/components/wrapper-form-group-card.vue'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'
import type {
  CreateProductBody,
  CreateProductShipping,
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
  StateSubmit,
} from '~/shared/api/shop/product/contracts/form.contract'

const router = useRouter()
const modal = useModal()

const fileImages = ref<File[]>([])
const formRef = ref()
const isProductHaveVariants = ref(false)
const btnSubmitRef = ref()
const enabledButtonSubmit = ref(false)
const countValidate = ref(0)
const hasImages = computed(() => fileImages.value.length > 0)
const { data: myShop } = useGetMyShop()
const shopCurrency = computed(() => myShop.value?.currency ?? 'USD')

const shipping = ref<CreateProductShipping | undefined>()

const noneVariant = reactive<StateNoneVariant>({
  stock: 1,
})

const singleVariant = reactive<StateSingleVariant>({})

const combineVariant = reactive<StateCombineVariant>({})

const stateSubmit = reactive<StateSubmit>({
  who_made: productWhoMadeOpts[0].id,
  is_digital: false,
  state: ProductStates.ACTIVE,
  variant_type: ProductVariantTypes.NONE,
  attributes: [],
  tags: [],
})

const {
  loadingSubmit,
  submit,
} = useCreateProductSubmit({
  fileImages,
  shipping,
  shopCurrency,
  noneVariant,
  singleVariant,
  combineVariant,
  stateSubmit,
})

const showCreateShippingProductDialog = () => {
  modal.open(CreateShippingProductDialog, {
    initData: shipping.value,
    onApply(val) {
      shipping.value = val
    },
  })
}

const validateForm = (values: CreateProductBody): FormError[] => {
  let errors: FormError[] = []
  countValidate.value++

  const result = createProductFormSchema.safeParse(values)
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

async function onSubmit(event: FormSubmitEvent<CreateProductBody>) {
  await submit(event.data)
}

function onErrorFrom(event: FormErrorEvent) {
  event.errors.sort((a, b) => {
    const sortingArr = ['description', 'title']
    return sortingArr.indexOf(b.path) - sortingArr.indexOf(a.path)
  })
  const element = document.getElementById(event.errors[0].id)
  element?.focus()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// enable button submit if valid
watchDebounced(
  () => [stateSubmit, noneVariant, fileImages.value, shipping],
  () => {
    const baseParsed = createProductFormSchema.safeParse(stateSubmit)
    const conditions = [baseParsed.success, shipping.value]

    if (stateSubmit.variant_type === ProductVariantTypes.NONE) {
      const resultParsed = createProductInventoryFormSchema.safeParse(noneVariant)
      conditions.push(resultParsed.success)
    }
    enabledButtonSubmit.value = conditions.every(Boolean)
  },
  { debounce: 500, maxWait: 1000, deep: true },
)

watch(isProductHaveVariants, () => {
  if (isProductHaveVariants.value) {
    noneVariant.amount = undefined
    noneVariant.stock = 1
  }
  stateSubmit.variant_type = isProductHaveVariants.value
    ? ProductVariantTypes.SINGLE
    : ProductVariantTypes.NONE
})
</script>

<template>
  <div>
    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :validate="validateForm"
      :state="stateSubmit"
      class="space-y-7"
      @error="onErrorFrom"
      @submit="onSubmit"
    >
      <FormGroupCard>
        <template #title>
          Basic info
        </template>
        <template #content>
          <ImagesInput
            v-model="fileImages"
            class="mb-4"
          />
          <UFormGroup
            label="Title"
            name="title"
            class="mb-4"
            description="Include keywords that buyers would use to search for your product."
            required
          >
            <UInput
              v-model.trim="stateSubmit.title"
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
          <div>
            <UFormGroup
              label="Type"
              name="is_digital"
              class="mb-4"
            >
              <RadioGroupInput
                v-model="stateSubmit.is_digital"
                :options="isDigitalOpts"
                :disabled="loadingSubmit"
                row
              />
            </UFormGroup>

            <div class="grid grid-cols-4">
              <UFormGroup
                label="Who made it?"
                name="who_made"
                required
                class="mb-4 max-w-[218px]"
              >
                <USelectMenu
                  v-model="stateSubmit.who_made"
                  size="lg"
                  :disabled="loadingSubmit"
                  :options="productWhoMadeOpts"
                  value-attribute="id"
                />
              </UFormGroup>
            </div>

            <SearchCategoryInput
              v-model="stateSubmit.category_id"
              :title="stateSubmit.title"
            />

            <SelectAttributesInput
              v-if="stateSubmit.category_id"
              :key="stateSubmit.category_id"
              v-model="stateSubmit.attributes"
              :category_id="stateSubmit.category_id"
            />
            <TagsInput v-model="stateSubmit.tags" />
          </div>
        </template>
      </FormGroupCard>

      <FormGroupCard>
        <template #title>
          Shipping
        </template>
        <template #subtitle>
          Give shoppers clear expectations about delivery time and cost by
          making sure your shipping info is accurate,
          including the shipping profile and your order processing schedule.
        </template>
        <template #content>
          <div>
            <UFormGroup
              class="mb-4"
              label="Shipping option"
              name="shipping"
              required
            >
              <div class="flex items-center gap-3">
                <div
                  v-if="shipping"
                  class="text-text-subtle"
                >
                  {{ shipping.process_time }} processing time, from {{ shipping.zip }}
                </div>
                <UButton
                  color="gray"
                  variant="solid"
                  @click="showCreateShippingProductDialog"
                >
                  {{ shipping ? 'Edit' : 'Add' }} shipping
                </UButton>
              </div>
            </UFormGroup>
          </div>
        </template>
      </FormGroupCard>

      <FormGroupCard>
        <template #title>
          Inventory and pricing
        </template>
        <template #content>
          <div>
            <UButton
              class="mb-4"
              color="gray"
              variant="solid"
              @click="() => isProductHaveVariants = !isProductHaveVariants"
            >
              {{ !isProductHaveVariants ? 'Add variantions' : 'Remove variantions' }}
            </UButton>
            <VariantInput
              v-if="isProductHaveVariants"
              v-model:single-variant="singleVariant"
              v-model:combine-variant="combineVariant"
              v-model:variant-type="stateSubmit.variant_type"
              :currency="shopCurrency"
              :count-validate="countValidate"
            />
            <NoneVariantInput
              v-else
              v-model:none-variant="noneVariant"
              :currency="shopCurrency"
              :disabled="loadingSubmit"
              class="max-w-[40%]"
            />
          </div>
        </template>
      </FormGroupCard>

      <button
        ref="btnSubmitRef"
        type="submit"
        class="hidden"
      />
    </UForm>

    <FixedFormActions>
      <UButton
        :disabled="loadingSubmit"
        size="md"
        color="gray"
        @click="router.push(`${ROUTES.ACCOUNT}${ROUTES.SHOP}${ROUTES.PRODUCTS}`)"
      >
        Cancel
      </UButton>
      <UButton
        :disabled="!enabledButtonSubmit || loadingSubmit"
        :loading="loadingSubmit && stateSubmit.state === ProductStates.DRAFT"
        size="md"
        type="submit"
        variant="outline"
        @click="() => {
          stateSubmit.state = ProductStates.DRAFT;
          btnSubmitRef.click();
        }"
      >
        Save draft
      </UButton>
      <UButton
        :disabled="!enabledButtonSubmit || !hasImages || loadingSubmit"
        :loading="loadingSubmit && stateSubmit.state === ProductStates.ACTIVE"
        size="md"
        type="submit"
        @click="() => btnSubmitRef.click()"
      >
        Publish product
      </UButton>
    </FixedFormActions>
  </div>
</template>
