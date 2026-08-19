<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  PRODUCT_CONFIG,
  productWhoMadeOpts,
} from '@arc/enums/product'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import NoneVariantInput from '../../../_components/none-variant-input.vue'
import ProductFormSectionNav from '../../../_components/product-form-section-nav.vue'
import SearchCategoryInput from '../../../_components/search-category-input.vue'
import SelectAttributesInput from '../../../_components/select-attributes-input.vue'
import TagsInput from '../../../_components/tags-input.vue'
import ImagesInput from './images-input.vue'
import VariantInput from './variant-input/variant-input.vue'
import UpdateProductFormActions from './update-product-form-actions.vue'
import { UPDATE_PRODUCT_FORM_SECTIONS } from './update-product-form.constants'
import { useUpdateProductForm } from './use-update-product-form'
import FormGroupCard from '~/app/components/wrapper-form-group-card.vue'

const sections = UPDATE_PRODUCT_FORM_SECTIONS

const {
  btnSubmit,
  canDeactivateFromDetail,
  canPublishFromDetail,
  countValidate,
  countValidateVariantsInputs,
  dataDetailProduct,
  disabledButtonSubmit,
  fileImages,
  formatStateLabel,
  idsImageForDelete,
  isVariantProduct,
  loadingAction,
  loadingSubmit,
  noneVariant,
  onChangeVariants,
  onChangeVariantType,
  onError,
  onSubmit,
  productState,
  publishImageError,
  stateSubmit,
  stateTone,
  submitWithAction,
  validateForm,
} = useUpdateProductForm()
</script>

<template>
  <div>
    <ProductFormSectionNav :sections="sections" />

    <UForm
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
              class="form-field-constrained mb-4"
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

    <UpdateProductFormActions
      :can-deactivate-from-detail="canDeactivateFromDetail"
      :can-publish-from-detail="canPublishFromDetail"
      :disabled-button-submit="disabledButtonSubmit"
      :loading-action="loadingAction"
      :loading-submit="loadingSubmit"
      :publish-image-error="publishImageError"
      @submit-action="submitWithAction"
    />
    <p
      v-if="publishImageError"
      class="mt-3 text-sm text-state-danger-text"
    >
      {{ publishImageError }}
    </p>
  </div>
</template>
