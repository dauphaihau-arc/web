<script setup lang="ts">
import { consola } from 'consola'
import ImagesInput from './images-input.vue'
import VariantInput from './variant-input.vue'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'
import { createProductBodySchema, createProductInventorySchema } from '~/shared/schemas/request/shop-product.schema'
import {
  isDigitalOpts,
  PRODUCT_CONFIG,
  ProductStates,
  ProductVariantTypes,
  productWhoMadeOpts,
} from '~/shared/config/enums/product'
import { ROUTES } from '~/shared/config/enums/routes'
import { toastCustom } from '~/shared/config/toast'
import CreateShippingProductDialog from '~/app/components/account/shop/products/create-shipping-product-dialog/create-shipping-product-dialog.vue'
import FormGroupCard from '~/app/components/account/shop/wrapper-form-group-card.vue'
import NoneVariantInput from '~/app/components/account/shop/products/none-variant-input.vue'
import SearchCategoryInput from '~/app/components/account/shop/products/search-category-input.vue'
import SelectAttributesInput from '~/app/components/account/shop/products/select-attributes-input.vue'
import TagsInput from '~/app/components/account/shop/products/tags-input.vue'
import { useShopCreateProduct } from '~/shared/server-state/shop/product/create-product.mutation'
import { useShopPublishProduct } from '~/shared/server-state/shop/product/publish-product.mutation'
import { useShopSetProductImagesByKeys } from '~/shared/server-state/shop/product/set-product-images-by-keys.mutation'
import { useIssueProductImageUploadUrl } from '~/shared/server-state/upload/issue-product-image-upload-url.mutation'
import type {
  CombineVariant,
  CreateProductBody,
  CreateProductShipping, NoneVariant,
  RequestCreateProductDraftBody,
  SingleVariant,
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
  StateSubmit,
} from '~/shared/types/request-api/shop-product'
import type { PickPartial } from '~/shared/types/utils'

const router = useRouter()
const toast = useToast()
const modal = useModal()

const fileImages = ref<File[]>([])
const formRef = ref()
const isProductHaveVariants = ref(false)
const loadingSubmit = ref(false)
const btnSubmitRef = ref()
const enabledButtonSubmit = ref(false)
const countValidate = ref(0)

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
  mutateAsync: createProduct,
} = useShopCreateProduct()

const {
  mutateAsync: publishProduct,
} = useShopPublishProduct()

const {
  mutateAsync: setProductImagesByKeys,
} = useShopSetProductImagesByKeys()

const {
  mutateAsync: issueProductImageUploadUrl,
} = useIssueProductImageUploadUrl()

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

  const result = createProductBodySchema.safeParse(values)
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

type CreateProductSubmitBody = {
  shipping: CreateProductShipping
} & PickPartial<CreateProductBody, 'attributes' | 'tags'> & (
  NoneVariant |
  SingleVariant |
  CombineVariant
)

async function uploadImage(productId: string) {
  if (fileImages.value.length === 0) {
    consola.error('images is invalid')
    return
  }

  const promisesUploadImages = []
  const storageKeys = []

  for (let i = 0; i < fileImages.value.length; i++) {
    const { presigned_url, key } = await issueProductImageUploadUrl({
      productId,
      content_type: fileImages.value[i].type,
      asset_type: 'original',
    })

    if (!presigned_url || !key) {
      toast.add({
        ...toastCustom.error,
        title: 'Oops',
        description: 'Something wrong',
      })
      return
    }

    storageKeys.push(key)

    const promise = useFetch(presigned_url, {
      method: 'PUT',
      headers: {
        'Content-Type': fileImages.value[i].type,
      },
      body: fileImages.value[i],
    })

    promisesUploadImages.push(promise)
  }

  await Promise.all(promisesUploadImages)

  return storageKeys
}

function mapAttributes(
  attributes: NonNullable<CreateProductBody['attributes']>,
): RequestCreateProductDraftBody['attributes'] {
  return attributes.map(attribute => ({
    category_attribute_id: attribute.attribute_id,
    selected_option_id: attribute.selected,
  }))
}

function mapInventoryAndVariants(
  bodyData: CreateProductSubmitBody,
): Pick<RequestCreateProductDraftBody, 'inventory' | 'variants'> {
  if (bodyData.variant_type === ProductVariantTypes.NONE) {
    return {
      inventory: [
        {
          price: bodyData.price!,
          sale_price: undefined,
          sku: bodyData.sku,
          stock: bodyData.stock,
        },
      ],
    }
  }

  if (bodyData.variant_type === ProductVariantTypes.SINGLE) {
    const variants = bodyData.variant_options.map((variant, index) => {
      const clientKey = `variant-${index + 1}`

      return {
        client_key: clientKey,
        option_value_1: variant.variant_name,
        inventory: {
          variant_client_key: clientKey,
          price: variant.price,
          sale_price: undefined,
          sku: variant.sku,
          stock: variant.stock,
        },
      }
    })

    return {
      variants: variants.map(variant => ({
        client_key: variant.client_key,
        option_value_1: variant.option_value_1,
      })),
      inventory: variants.map(variant => variant.inventory),
    }
  }

  const variants = bodyData.variant_options.flatMap((variant, parentIndex) => {
    return variant.variant_options.map((subVariant, childIndex) => {
      const clientKey = `variant-${parentIndex + 1}-${childIndex + 1}`

      return {
        client_key: clientKey,
        option_value_1: variant.variant_name,
        option_value_2: subVariant.variant_name,
        inventory: {
          variant_client_key: clientKey,
          price: subVariant.price,
          sale_price: undefined,
          sku: subVariant.sku,
          stock: subVariant.stock,
        },
      }
    })
  })

  return {
    variants: variants.map(variant => ({
      client_key: variant.client_key,
      option_value_1: variant.option_value_1,
      option_value_2: variant.option_value_2,
    })),
    inventory: variants.map(variant => variant.inventory),
  }
}

function mapShipping(
  data: CreateProductShipping,
): RequestCreateProductDraftBody['shipping'] {
  return {
    origin_country: data.country,
    origin_zip: data.zip,
    process_time_label: data.process_time,
    destinations: data.standard_shipping.map(destination => ({
      country_code: destination.country,
      delivery_time_label: destination.delivery_time,
      service: destination.service,
      charge_type: destination.charge,
    })),
  }
}

async function onSubmit(event: FormSubmitEvent<CreateProductBody>) {
  const dataSubmit = event.data as PickPartial<CreateProductBody, 'attributes' | 'tags'>

  if (fileImages.value.length === 0) {
    consola.error('images is invalid')
    return
  }
  if (!shipping.value) {
    consola.error('shipping be undefined')
    return
  }
  if (dataSubmit.tags && dataSubmit.tags.length === 0) {
    delete dataSubmit.tags
  }
  if (dataSubmit.attributes && dataSubmit.attributes.length === 0) {
    delete dataSubmit.attributes
  }

  let bodyData: CreateProductSubmitBody = {
    ...dataSubmit,
    shipping: shipping.value,
  } as CreateProductSubmitBody
  switch (bodyData.variant_type) {
    case 'none':
      bodyData = { ...bodyData, ...noneVariant as NoneVariant }
      break
    case 'single':
      if (!singleVariant.variant_options) return
      bodyData = { ...bodyData, ...singleVariant as SingleVariant }
      break
    case 'combine':
      if (!combineVariant.variant_options) return
      bodyData = { ...bodyData, ...combineVariant as CombineVariant }
      break
  }

  loadingSubmit.value = true

  try {
    const productDraft = await createProduct({
      category_id: bodyData.category_id,
      title: bodyData.title,
      description: bodyData.description,
      who_made: bodyData.who_made,
      is_digital: bodyData.is_digital,
      non_taxable: false,
      variant_type: bodyData.variant_type,
      variant_group_name:
        bodyData.variant_type === ProductVariantTypes.NONE
          ? undefined
          : bodyData.variant_group_name,
      variant_sub_group_name:
        bodyData.variant_type === ProductVariantTypes.COMBINE
          ? bodyData.variant_sub_group_name
          : undefined,
      attributes: bodyData.attributes?.length
        ? mapAttributes(bodyData.attributes)
        : undefined,
      ...mapInventoryAndVariants(bodyData),
      shipping: mapShipping(bodyData.shipping),
    })

    const storageKeys = await uploadImage(productDraft.id)
    if (!storageKeys) return

    await setProductImagesByKeys({
      id: productDraft.id,
      images: storageKeys.map((key, index) => ({
        storage_key: key,
        rank: index + 1,
      })),
    })

    if (stateSubmit.state === ProductStates.ACTIVE) {
      await publishProduct(productDraft.id)
    }

    toast.add({
      ...toastCustom.success,
      title: stateSubmit.state === ProductStates.ACTIVE
        ? 'Create product success'
        : 'Save draft success',
    })
    await router.push(ROUTES.ACCOUNT + ROUTES.SHOP + ROUTES.PRODUCTS)
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Create product failed',
    })
  }

  loadingSubmit.value = false
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
    const baseParsed = createProductBodySchema.safeParse(stateSubmit)
    const conditions = [baseParsed.success, fileImages.value.length > 0, shipping.value]

    if (stateSubmit.variant_type === ProductVariantTypes.NONE) {
      const resultParsed = createProductInventorySchema.safeParse(noneVariant)
      conditions.push(resultParsed.success)
    }
    enabledButtonSubmit.value = conditions.every(Boolean)
  },
  { debounce: 500, maxWait: 1000, deep: true },
)

watch(isProductHaveVariants, () => {
  if (isProductHaveVariants.value) {
    noneVariant.price = undefined
    noneVariant.stock = 1
  }
  stateSubmit.variant_type = isProductHaveVariants.value
    ? ProductVariantTypes.SINGLE
    : ProductVariantTypes.NONE
})
</script>

<template>
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
                class="text-gray-600"
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
            :count-validate="countValidate"
          />
          <NoneVariantInput
            v-else
            v-model:none-variant="noneVariant"
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

  <div class="fixed-actions-form">
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
      Save
    </UButton>
    <UButton
      :disabled="!enabledButtonSubmit || loadingSubmit"
      :loading="loadingSubmit && stateSubmit.state === ProductStates.ACTIVE"
      size="md"
      type="submit"
      @click="() => btnSubmitRef.click()"
    >
      Save & Display
    </UButton>
  </div>
</template>

<style scoped>
@import url("~/app/assets/css/layout-shop.css");
</style>
