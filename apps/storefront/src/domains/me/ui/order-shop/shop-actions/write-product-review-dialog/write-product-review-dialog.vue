<script setup lang="ts">
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants'
import ItemMediaSection from './item-media-section/item-media-section.vue'
import type { FormSubmitEvent } from '#ui/types'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import type { UpsertMyProductReviewRequest } from '~/domains/me/api/product-review/contracts/product-review.contract'
import { toastCustom } from '~/shared/config/toast'
import { useUpsertMyProductReview } from '~/domains/me/mutations/product-reviews/upsert-review.mutation'
import { resolveStorageKeyFromPublicUrl } from '~/shared/utils/storage-public-url'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'

type OrderShop = GetOrderShopsResponse['order_shops'][number]

type ReviewFormState = UpsertMyProductReviewRequest & {
  orderItemId: string
}

const props = withDefaults(defineProps<{
  orderShop: OrderShop
  /** Restricts the reviewable item picker, e.g. to the items of one package. */
  orderItemIds?: string[]
}>(), {
  orderItemIds: undefined,
})

const t = useAccountTranslator()

const ratingOptions = computed<ReadonlyArray<{
  value: number
  label: string
  icon: AppIconAlias
}>>(() => [
  { value: 1, label: t('account.orders.reviewDialog.ratings.bad'), icon: 'ratingVeryBad' },
  { value: 2, label: t('account.orders.reviewDialog.ratings.poor'), icon: 'ratingBad' },
  { value: 3, label: t('account.orders.reviewDialog.ratings.okay'), icon: 'ratingNeutral' },
  { value: 4, label: t('account.orders.reviewDialog.ratings.good'), icon: 'ratingGood' },
  { value: 5, label: t('account.orders.reviewDialog.ratings.excellent'), icon: 'ratingExcellent' },
])

const dialog = useModal()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const formRef = ref()
const isUploadingImages = ref(false)

const reviewableProducts = computed(() => {
  const orderItemIds = props.orderItemIds

  return orderItemIds
    ? props.orderShop.products.filter(product => orderItemIds.includes(product.id))
    : props.orderShop.products
})

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
      title: t('account.orders.reviewDialog.imagesUploadingToast'),
      description: t('account.orders.reviewDialog.imagesUploadingDescription'),
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
  state.image_keys = (review?.images ?? [])
    .map(image => resolveStorageKeyFromPublicUrl(image.url, runtimeConfig.public.assetHost))
    .filter((key): key is string => !!key)
}

watch(() => state.orderItemId, () => {
  syncFormWithSelectedProduct()
}, { immediate: true })
</script>

<template>
  <BaseDialog
    :title="isEditMode
      ? t('account.orders.reviewDialog.editTitle')
      : t('account.orders.reviewDialog.title')"
    :description="isEditMode
      ? t('account.orders.reviewDialog.editDescription')
      : t('account.orders.reviewDialog.description')"
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
          :label="t('account.common.rating')"
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
              :aria-label="t('account.orders.reviewDialog.ratingAria', { label: option.label })"
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
          :label="t('account.orders.reviewDialog.headline')"
          name="title"
        >
          <UInput
            v-model="state.title"
            :maxlength="120"
            :placeholder="t('account.orders.reviewDialog.headlinePlaceholder')"
          />
        </UFormGroup>

        <UFormGroup
          :label="t('account.common.review')"
          name="body"
        >
          <UTextarea
            v-model="state.body"
            :rows="6"
            :maxlength="5000"
            :placeholder="t('account.orders.reviewDialog.reviewPlaceholder')"
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
          {{ t('account.common.close') }}
        </UButton>
        <UButton
          :loading="isPending"
          :disabled="submitDisabled"
          @click="formRef?.submit"
        >
          {{ isUploadingImages
            ? t('account.orders.reviewDialog.uploading')
            : isEditMode
              ? t('account.orders.reviewDialog.update')
              : t('account.orders.reviewDialog.submit') }}
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
