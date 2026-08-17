<script setup lang="ts">
import {
  isDigitalOpts,
  PRODUCT_CONFIG,
  ProductStates,
  productWhoMadeOpts,
} from '@arc/enums/product'
import NoneVariantInput from '../../../_components/none-variant-input.vue'
import SearchCategoryInput from '../../../_components/search-category-input.vue'
import SelectAttributesInput from '../../../_components/select-attributes-input.vue'
import TagsInput from '../../../_components/tags-input.vue'
import ProductFormSectionNav from '../../../_components/product-form-section-nav.vue'
import CreateShippingProductDialog from './create-shipping-product-dialog/create-shipping-product-dialog.vue'
import ImagesInput from './images-input.vue'
import VariantInput from './variant-input/variant-input.vue'
import CreateProductFormActions from './create-product-form-actions.vue'
import CreateProductShippingSection from './create-product-shipping-section.vue'
import { PRODUCT_FORM_SECTIONS } from './create-product-form.constants'
import { useCreateProductForm } from './use-create-product-form'
import FormGroupCard from '~/app/components/wrapper-form-group-card.vue'
import { routes } from '~/shared/navigation/routes'

const router = useRouter()
const modal = useModal()
const sections = PRODUCT_FORM_SECTIONS

const {
  btnSubmitRef,
  canGenerateDescription,
  combineVariant,
  countValidate,
  enabledButtonSubmit,
  fileImages,
  generatingDescription,
  hasImages,
  isAiDescriptionEnabled,
  isProductHaveVariants,
  loadingSubmit,
  noneVariant,
  onErrorFrom,
  onGenerateDescription,
  onSubmit,
  shipping,
  shopCurrency,
  singleVariant,
  stateSubmit,
  titleInputRef,
  validateForm,
} = useCreateProductForm()

const showCreateShippingProductDialog = () => {
  modal.open(CreateShippingProductDialog, {
    initData: shipping.value,
    onApply(val) {
      shipping.value = val
    },
  })
}

function onCancel() {
  router.push(routes.products())
}

function onSaveDraft() {
  stateSubmit.state = ProductStates.DRAFT
  btnSubmitRef.value?.click()
}

function onPublishProduct() {
  btnSubmitRef.value?.click()
}
</script>

<template>
  <div>
    <ProductFormSectionNav :sections="sections" />

    <UForm
      :validate-on="['submit']"
      :validate="validateForm"
      :state="stateSubmit"
      class="space-y-7"
      @error="onErrorFrom"
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
            <ImagesInput
              v-model="fileImages"
              class="mb-4"
            />
            <UFormGroup
              label="Title"
              name="title"
              class="form-field-constrained mb-4"
              description="Include keywords that buyers would use to search for your product."
              required
            >
              <UInput
                ref="titleInputRef"
                v-model.trim="stateSubmit.title"
                :disabled="loadingSubmit"
                size="lg"
              />
            </UFormGroup>
            <UFormGroup
              label="Description"
              name="description"
              class="form-field-constrained"
              :description="isAiDescriptionEnabled
                ? 'Generate a starting draft, then edit it to match your product.'
                : undefined"
              :help="stateSubmit.description
                && `${stateSubmit.description.length}/${PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION}`
              "
              required
            >
              <div class="relative">
                <div
                  v-if="isAiDescriptionEnabled"
                  class="absolute right-3 top-3 z-10"
                >
                  <UTooltip :text="canGenerateDescription ? 'Generate with AI' : 'Add a title first to generate with AI'">
                    <UButton
                      type="button"
                      color="gray"
                      variant="ghost"
                      square
                      :disabled="loadingSubmit"
                      :loading="generatingDescription"
                      :aria-label="generatingDescription ? 'Generating description' : 'Generate description with AI'"
                      @click="onGenerateDescription"
                    >
                      <template #leading="{ loading }">
                        <AppIcon
                          v-if="!loading"
                          name="ai"
                          size="lg"
                        />
                      </template>
                    </UButton>
                  </UTooltip>
                </div>
                <UTextarea
                  v-model="stateSubmit.description"
                  autoresize
                  :maxlength="PRODUCT_CONFIG.MAX_CHAR_DESCRIPTION"
                  :rows="5"
                  :disabled="loadingSubmit || generatingDescription"
                  size="lg"
                  textarea-class="!pr-14"
                />
              </div>
            </UFormGroup>
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
            <div>
              <UButton
                class="mb-4"
                color="gray"
                variant="solid"
                @click="() => isProductHaveVariants = !isProductHaveVariants"
              >
                {{ isProductHaveVariants ? 'Remove variantions' : 'Add variantions' }}
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
      </section>

      <CreateProductShippingSection
        :shipping="shipping"
        @edit="showCreateShippingProductDialog"
      />

      <button
        ref="btnSubmitRef"
        type="submit"
        class="hidden"
      />
    </UForm>

    <CreateProductFormActions
      :enabled-button-submit="enabledButtonSubmit"
      :has-images="hasImages"
      :loading-submit="loadingSubmit"
      :product-state="stateSubmit.state"
      @cancel="onCancel"
      @publish="onPublishProduct"
      @save-draft="onSaveDraft"
    />
  </div>
</template>
