import {
  buildProductLabel,
  formatFileSize,
  MAX_REVIEW_IMAGES,
  MAX_REVIEW_IMAGE_BYTES,
} from './item-media-section.constants'
import type { ResponseGetOrderShopsProduct } from '~/shared/api/me/order/contracts/order.contract'
import { toastCustom } from '~/shared/config/toast'
import { uploadReviewImage } from '~/shared/server-state/me/product-reviews/upload-review-image.mutation'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'

type ProductReview = ResponseGetOrderShopsProduct['my_review']

export type ReviewImageUploadItem = {
  id: string
  file?: File
  key?: string
  error?: string
  previewUrl: string
  displayName: string
  sizeLabel: string
  isObjectUrl: boolean
  status: 'uploading' | 'uploaded' | 'failed'
}

type ItemMediaSectionProps = {
  products: ResponseGetOrderShopsProduct[]
  orderItemId: string
  selectedProductReview?: ProductReview
  disabled?: boolean
}

type ItemMediaSectionEmit = {
  (event: 'update:imageKeys', value: string[]): void
  (event: 'uploading-change', value: boolean): void
}

export function useItemMediaSection(
  props: ItemMediaSectionProps,
  emit: ItemMediaSectionEmit,
) {
  const toast = useToast()
  const runtimeConfig = useRuntimeConfig()
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const reviewImages = ref<ReviewImageUploadItem[]>([])

  const productOptions = computed(() =>
    props.products.map(product => ({
      label: `${buildProductLabel(product)}${product.my_review ? ' (reviewed)' : ''}`,
      value: product.id,
    })),
  )

  const isUploadingImages = computed(() =>
    reviewImages.value.some(image => image.status === 'uploading'),
  )
  const hasFailedImages = computed(() =>
    reviewImages.value.some(image => image.status === 'failed'),
  )
  const canAddMoreImages = computed(() =>
    reviewImages.value.length < MAX_REVIEW_IMAGES,
  )

  function openFilePicker() {
    if (props.disabled || !canAddMoreImages.value || isUploadingImages.value) {
      return
    }

    fileInputRef.value?.click()
  }

  async function onFileSelection(event: Event) {
    const input = event.target as HTMLInputElement | null
    const files = Array.from(input?.files ?? [])

    if (!files.length) {
      return
    }

    const remainingSlots = MAX_REVIEW_IMAGES - reviewImages.value.length

    if (remainingSlots <= 0) {
      toast.add({
        ...toastCustom.warning,
        title: `You can add up to ${MAX_REVIEW_IMAGES} photos`,
      })
      resetFileInput()
      return
    }

    if (files.length > remainingSlots) {
      toast.add({
        ...toastCustom.warning,
        title: `Only ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'} can be added`,
      })
    }

    for (const file of files.slice(0, remainingSlots)) {
      if (!file.type.startsWith('image/')) {
        toast.add({
          ...toastCustom.error,
          title: `"${file.name}" is not an image`,
        })
        continue
      }

      if (file.size > MAX_REVIEW_IMAGE_BYTES) {
        toast.add({
          ...toastCustom.error,
          title: `"${file.name}" is larger than 8 MB`,
        })
        continue
      }

      await addAndUploadImage(file)
    }

    resetFileInput()
  }

  async function addAndUploadImage(file: File) {
    const image = reactive<ReviewImageUploadItem>({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      displayName: file.name,
      sizeLabel: formatFileSize(file.size),
      isObjectUrl: true,
      status: 'uploading',
    })

    reviewImages.value.push(image)
    syncImageKeys()

    try {
      const result = await uploadReviewImage({
        orderItemId: props.orderItemId,
        file,
        apiBaseURL: runtimeConfig.public.apiBaseURL,
      })

      image.key = result.key
      image.status = 'uploaded'
      image.error = undefined
      syncImageKeys()
    }
    catch (error) {
      image.status = 'failed'
      image.error = error instanceof Error ? error.message : 'Unable to upload image'
      syncImageKeys()

      toast.add({
        ...toastCustom.error,
        title: 'Review image upload failed',
        description: image.error,
      })
    }
  }

  function removeImage(imageId: string) {
    const index = reviewImages.value.findIndex(image => image.id === imageId)

    if (index === -1) {
      return
    }

    if (reviewImages.value[index].isObjectUrl) {
      URL.revokeObjectURL(reviewImages.value[index].previewUrl)
    }

    reviewImages.value.splice(index, 1)
    syncImageKeys()
  }

  function resetFileInput() {
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }

  function syncImageKeys() {
    emit('update:imageKeys', reviewImages.value
      .filter(image => image.status === 'uploaded' && image.key)
      .map(image => image.key!))
  }

  function clearReviewImages() {
    reviewImages.value.forEach((image) => {
      if (image.isObjectUrl) {
        URL.revokeObjectURL(image.previewUrl)
      }
    })

    reviewImages.value = []
    syncImageKeys()
    resetFileInput()
  }

  function syncImagesWithSelectedProduct() {
    clearReviewImages()

    reviewImages.value = (props.selectedProductReview?.images ?? []).map((image, index) => reactive<ReviewImageUploadItem>({
      id: image.id,
      key: image.storage_key,
      previewUrl: resolveProductImageUrl(image, runtimeConfig.public.assetHost, 'thumb_1x1')
        ?? image.url
        ?? image.storage_key,
      displayName: `Review photo ${index + 1}`,
      sizeLabel: image.size_bytes ? formatFileSize(image.size_bytes) : '',
      isObjectUrl: false,
      status: 'uploaded',
    }))

    syncImageKeys()
  }

  function imageProgressValue(status: ReviewImageUploadItem['status']) {
    if (status === 'uploaded') {
      return 100
    }

    if (status === 'failed') {
      return 0
    }

    return 72
  }

  function imageProgressLabel(image: ReviewImageUploadItem) {
    if (image.status === 'failed') {
      return 'Failed'
    }

    return `${imageProgressValue(image.status)}%`
  }

  watch(isUploadingImages, value => emit('uploading-change', value), { immediate: true })
  watch(
    [() => props.orderItemId, () => props.selectedProductReview],
    () => {
      syncImagesWithSelectedProduct()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    clearReviewImages()
  })

  return {
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
  }
}
