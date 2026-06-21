<script setup lang="ts">
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants'
import ItemMediaSection from './item-media-section/item-media-section.vue'
import type { FormSubmitEvent } from '#ui/types'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'
import type { UpsertMyProductReviewRequest } from '~/shared/api/me/product-review/contracts/product-review.contract'
import { toastCustom } from '~/shared/config/toast'
import { useUpsertMyProductReview } from '~/shared/server-state/me/product-reviews/upsert-review.mutation'

type OrderShop = GetOrderShopsResponse['order_shops'][number]

type ReviewFormState = UpsertMyProductReviewRequest & {
  orderItemId: string
}

const ratingOptions: ReadonlyArray<{
  value: number
  label: string
  icon: AppIconAlias
}> = [
  { value: 1, label: 'Bad', icon: 'ratingVeryBad' },
  { value: 2, label: 'Poor', icon: 'ratingBad' },
  { value: 3, label: 'Okay', icon: 'ratingNeutral' },
  { value: 4, label: 'Good', icon: 'ratingGood' },
  { value: 5, label: 'Excellent', icon: 'ratingExcellent' },
]

const props = defineProps<{
  orderShop: OrderShop
}>()

const dialog = useModal()
const toast = useToast()
const formRef = ref()
const isUploadingImages = ref(false)

const reviewableProducts = computed(() => props.orderShop.products)

const state = reactive<ReviewFormState>({
  orderItemId: reviewableProducts.value.find(product => !product.my_review)?.id ?? reviewableProducts.value[0]?.id ?? '',
  rating: 5,
  title: '',
  body: '',
  image_keys: [],
})

const selectedProduct = computed(() =>
  reviewableProducts.value.find(product => product.id === state.orderItemId),
)
const selectedProductReview = computed(() => selectedProduct.value?.my_review)
const isEditMode = computed(() => Boolean(selectedProductReview.value))
const submitDisabled = computed(() =>
  isPending.value || isUploadingImages.value || !state.orderItemId,
)

const { mutateAsync: upsertReview, isPending } = useUpsertMyProductReview()

async function onSubmit(event: FormSubmitEvent<ReviewFormState>) {
  if (isUploadingImages.value) {
    toast.add({
      ...toastCustom.warning,
      title: 'Images are still uploading',
      description: 'Wait for uploads to finish before submitting your review.',
    })
    return
  }

  const { orderItemId } = event.data
  const body: UpsertMyProductReviewRequest = {
    rating: state.rating,
    title: state.title || undefined,
    body: state.body || undefined,
    image_keys: state.image_keys,
  }

  await upsertReview({
    orderItemId,
    body,
  })
  await dialog.close()
}

function setRating(rating: number) {
  state.rating = rating
}

function syncFormWithSelectedProduct() {
  const review = selectedProductReview.value

  state.rating = review?.rating ?? 5
  state.title = review?.title ?? ''
  state.body = review?.body ?? ''
  state.image_keys = (review?.images ?? []).map(image => image.storage_key)
}

watch(() => state.orderItemId, () => {
  syncFormWithSelectedProduct()
}, { immediate: true })
</script>

<template>
  <BaseDialog
    :title="isEditMode ? 'Edit your review' : 'Write a review'"
    :description="isEditMode ? 'Update your rating, notes, or photos for this item.' : 'Share what arrived well and what other shoppers should know about this item.'"
  >
    <UForm
      ref="formRef"
      :state="state"
      @submit="onSubmit"
    >
      <div class="space-y-4">
        <ItemMediaSection
          v-model:order-item-id="state.orderItemId"
          :products="reviewableProducts"
          :selected-product-review="selectedProductReview"
          :disabled="isPending"
          @update:image-keys="state.image_keys = $event"
          @uploading-change="isUploadingImages = $event"
        />

        <UFormGroup
          required
          label="Rating"
          name="rating"
        >
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <UButton
              v-for="option in ratingOptions"
              :key="option.value"
              :color="state.rating === option.value ? 'primary' : 'gray'"
              :variant="state.rating === option.value ? 'solid' : 'soft'"
              size="sm"
              type="button"
              class="h-auto flex-col justify-center gap-1 py-2 text-center leading-tight"
              :aria-label="`Rate this product ${option.label}`"
              @click="setRating(option.value)"
            >
              <AppIcon
                :name="option.icon"
                size="xs"
              />
              {{ option.label }}
            </UButton>
          </div>
        </UFormGroup>

        <UFormGroup
          label="Headline"
          name="title"
        >
          <UInput
            v-model="state.title"
            :maxlength="120"
            placeholder="Short summary"
          />
        </UFormGroup>

        <UFormGroup
          label="Review"
          name="body"
        >
          <UTextarea
            v-model="state.body"
            :rows="6"
            :maxlength="5000"
            placeholder="What stood out once you received it?"
          />
        </UFormGroup>
      </div>
    </UForm>

    <template #footer>
      <DialogActions full-width>
        <UButton
          color="gray"
          :disabled="submitDisabled"
          @click="dialog.close"
        >
          Close
        </UButton>
        <UButton
          :loading="isPending"
          :disabled="submitDisabled"
          @click="formRef?.submit"
        >
          {{ isUploadingImages ? 'Uploading photos...' : isEditMode ? 'Update review' : 'Submit review' }}
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
