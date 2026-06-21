<script setup lang="ts">
import { MAX_REVIEW_IMAGES } from './item-media-section.constants'
import { useItemMediaSection } from './use-item-media-section'
import type { ResponseGetOrderShopsProduct } from '~/shared/api/me/order/contracts/order.contract'

type ProductReview = ResponseGetOrderShopsProduct['my_review']

const props = defineProps<{
  products: ResponseGetOrderShopsProduct[]
  orderItemId: string
  selectedProductReview?: ProductReview
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:orderItemId': [value: string]
  'update:imageKeys': [value: string[]]
  'uploading-change': [value: boolean]
}>()

const {
  canAddMoreImages,
  fileInputRef,
  hasFailedImages,
  imageProgressLabel,
  imageProgressValue,
  isUploadingImages,
  onFileSelection,
  openFilePicker,
  productOptions,
  removeImage,
  reviewImages,
} = useItemMediaSection(props, emit)
</script>

<template>
  <div class="space-y-4">
    <UFormGroup
      required
      label="Item"
      name="orderItemId"
    >
      <USelectMenu
        :model-value="orderItemId"
        :options="productOptions"
        value-attribute="value"
        option-attribute="label"
        @update:model-value="emit('update:orderItemId', $event)"
      />
    </UFormGroup>

    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-medium text-text-strong">
            Photos
          </h3>
          <p class="text-sm text-text-subtle">
            Add up to {{ MAX_REVIEW_IMAGES }} photos. PNG, JPG, WEBP, up to 8 MB each.
          </p>
        </div>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="onFileSelection"
      >

      <div
        role="button"
        :tabindex="disabled || !canAddMoreImages || isUploadingImages ? -1 : 0"
        :aria-disabled="disabled || !canAddMoreImages || isUploadingImages"
        :class="[
          'group flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-muted bg-surface-subtle px-6 py-6 text-center transition',
          disabled || !canAddMoreImages || isUploadingImages
            ? 'cursor-not-allowed opacity-60'
            : 'hover:border-primary/40 hover:bg-surface',
        ]"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
      >
        <div class="flex size-8 items-center justify-center rounded-full bg-surface shadow-sm">
          <AppIcon
            name="uploadCloud"
            size="lg"
            class="text-text-subtle transition group-hover:text-primary"
          />
        </div>

        <div class="">
          <p class="text-base font-semibold text-text-strong">
            Upload product image(s)
          </p>
          <p class="text-sm text-text-muted">
            <span class="font-medium text-text-strong underline underline-offset-2">Click to browse</span>
            your files (8 MB max each)
          </p>
        </div>
      </div>

      <div
        v-if="reviewImages.length > 0"
        class="space-y-3"
      >
        <div
          v-for="image in reviewImages"
          :key="image.id"
          class="rounded-lg border border-border-subtle bg-surface p-3 shadow-sm"
        >
          <div class="flex items-start gap-3">
            <div class="size-16 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface-muted">
              <img
                :src="image.previewUrl"
                :alt="image.displayName"
                class="h-full w-full object-cover"
              >
            </div>

            <div class="min-w-0 flex-1 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-base font-semibold text-text-strong">
                    {{ image.displayName }}
                  </p>
                  <div
                    v-if="image.sizeLabel"
                    class="text-sm text-text-muted"
                  >
                    <span>{{ image.sizeLabel }}</span>
                  </div>
                </div>

                <UButton
                  type="button"
                  color="gray"
                  variant="ghost"
                  square
                  :disabled="disabled"
                  @click="removeImage(image.id)"
                >
                  <AppIcon
                    name="trash"
                    class="text-text-muted"
                  />
                </UButton>
              </div>

              <div
                v-if="image.status === 'uploading'"
                class="flex items-center gap-3"
              >
                <UProgress
                  :value="imageProgressValue(image.status)"
                  color="primary"
                  size="lg"
                  class="flex-1"
                  :ui="{
                    rounded: 'rounded-full',
                    base: 'overflow-hidden rounded-full',
                    track: 'bg-customGray-200/80',
                  }"
                />
                <span class="w-10 text-right text-sm font-semibold text-text-strong">
                  {{ imageProgressLabel(image) }}
                </span>
              </div>

              <p
                v-if="image.error"
                class="text-xs text-red-600"
              >
                {{ image.error }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <UAlert
        v-if="hasFailedImages"
        color="red"
        variant="soft"
        title="Some images failed to upload"
        description="Remove the failed image and try selecting it again."
      />
    </div>
  </div>
</template>
