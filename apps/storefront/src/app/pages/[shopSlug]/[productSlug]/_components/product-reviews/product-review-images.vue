<script lang="ts" setup>
import type { GetPublicProductReviewImagesResponse } from '~/shared/api/product/contracts/product.contract'
import { useGetPublicProductReviewImages } from '~/shared/server-state/product/review-images.query'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'

type CarouselRef = {
  page?: number | { value?: number }
  pages?: number | { value?: number }
}

const props = defineProps<{
  shopSlug: string
  productSlug: string
}>()

const config = useRuntimeConfig()
const carousel = ref<CarouselRef | null>(null)
const skeletonItems = Array.from({ length: 4 }, (_, index) => `review-image-skeleton-${index + 1}`)
const arrowButtonClass = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white text-text shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:text-text hover:shadow-md active:scale-95'
const reviewImageLimit = 6
const reviewImageCursor = ref<string>()
const reviewImageItems = ref<GetPublicProductReviewImagesResponse['items']>([])
const reviewImageMeta = ref<GetPublicProductReviewImagesResponse['meta']>({
  next_cursor: undefined,
  has_more: false,
})
const loadedReviewImagePageKeys = ref<string[]>([])

function unwrapCarouselValue(value?: number | { value?: number }) {
  return typeof value === 'number' ? value : value?.value
}

const currentPage = computed(() => Number(unwrapCarouselValue(carousel.value?.page) ?? 0))
const totalPages = computed(() => Number(unwrapCarouselValue(carousel.value?.pages) ?? 0))

const reviewImageQueryParams = computed(() => ({
  limit: reviewImageLimit,
  ...(reviewImageCursor.value ? { cursor: reviewImageCursor.value } : {}),
}))

const {
  data: productReviewImagePage,
  isFetching: reviewImagesLoading,
} = useGetPublicProductReviewImages(props.shopSlug, props.productSlug, reviewImageQueryParams)

function appendReviewImageItems(
  existing: GetPublicProductReviewImagesResponse['items'],
  incoming: GetPublicProductReviewImagesResponse['items'],
) {
  const seenIds = new Set(existing.map(item => item.id))
  const nextItems = [...existing]

  incoming.forEach((item) => {
    if (seenIds.has(item.id)) {
      return
    }

    seenIds.add(item.id)
    nextItems.push(item)
  })

  return nextItems
}

const resolvedItems = computed(() => {
  return reviewImageItems.value
    .map((image) => {
      const src = resolveProductImageUrl(image, config.public.assetHost, 'card_1x1')

      if (!src) {
        return null
      }

      return {
        id: image.id,
        src,
        alt: image.review_title || `Review photo from ${image.author.display_name}`,
      }
    })
    .filter((image): image is { id: string, src: string, alt: string } => image !== null)
})

const useCarousel = computed(() => resolvedItems.value.length > 4)

function requestMoreIfNeeded() {
  if (
    !useCarousel.value
    || reviewImagesLoading.value
    || !reviewImageMeta.value.has_more
    || !reviewImageMeta.value.next_cursor
    || loadedReviewImagePageKeys.value.includes(reviewImageMeta.value.next_cursor)
    || totalPages.value <= 0
    || currentPage.value < Math.max(1, totalPages.value - 2)
  ) {
    return
  }

  reviewImageCursor.value = reviewImageMeta.value.next_cursor
}

function handleNext(onClick: () => void, disabled: boolean) {
  if (disabled) {
    return
  }

  onClick()
  requestMoreIfNeeded()
}

watch(
  productReviewImagePage,
  (value) => {
    if (!value) {
      return
    }

    const pageKey = reviewImageCursor.value ?? '__initial__'

    if (loadedReviewImagePageKeys.value.includes(pageKey)) {
      return
    }

    loadedReviewImagePageKeys.value = [...loadedReviewImagePageKeys.value, pageKey]
    reviewImageItems.value = pageKey === '__initial__'
      ? value.items
      : appendReviewImageItems(reviewImageItems.value, value.items)
    reviewImageMeta.value = value.meta
  },
  { immediate: true },
)

watch(
  () => [props.shopSlug, props.productSlug],
  () => {
    reviewImageCursor.value = undefined
    reviewImageItems.value = []
    reviewImageMeta.value = {
      next_cursor: undefined,
      has_more: false,
    }
    loadedReviewImagePageKeys.value = []
    carousel.value = null
  },
)

watch(
  () => [
    carousel.value?.page,
    carousel.value?.pages,
    resolvedItems.value.length,
    reviewImageMeta.value.has_more,
    reviewImagesLoading.value,
  ],
  () => requestMoreIfNeeded(),
)
</script>

<template>
  <div
    v-if="resolvedItems.length > 0 || reviewImagesLoading"
    class="space-y-4"
  >
    <h3 class="text-xl font-medium leading-tight tracking-tight text-text">
      Photos from reviews
    </h3>

    <div
      v-if="reviewImagesLoading && resolvedItems.length === 0"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        v-for="skeleton in skeletonItems"
        :key="skeleton"
        class="overflow-hidden rounded-[20px]"
      >
        <USkeleton class="aspect-square w-full rounded-[20px]" />
      </div>
    </div>

    <UCarousel
      v-else-if="useCarousel"
      ref="carousel"
      :items="resolvedItems"
      arrows
      :ui="{
        container: 'gap-4',
        item: 'basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/4)]',
        arrows: {
          wrapper: 'contents',
        },
      }"
    >
      <template #prev="{ onClick, disabled }">
        <UButton
          v-if="!disabled"
          variant="ghost"
          icon="i-heroicons-chevron-left-20-solid"
          :class="[arrowButtonClass, 'left-4']"
          aria-label="Previous"
          @click="onClick"
        />
      </template>

      <template #next="{ onClick, disabled }">
        <UButton
          v-if="!disabled"
          variant="ghost"
          icon="i-heroicons-chevron-right-20-solid"
          :class="[arrowButtonClass, 'right-4']"
          aria-label="Next"
          @click="handleNext(onClick, disabled)"
        />
      </template>

      <template #default="{ item }">
        <div class="overflow-hidden rounded-[20px] bg-surface-muted">
          <NuxtImg
            :src="item.src"
            :alt="item.alt"
            width="720"
            height="720"
            class="aspect-square w-full object-cover"
          />
        </div>
      </template>
    </UCarousel>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <div
        v-for="item in resolvedItems"
        :key="item.id"
        class="overflow-hidden rounded-[20px] bg-surface-muted"
      >
        <NuxtImg
          :src="item.src"
          :alt="item.alt"
          width="720"
          height="720"
          class="aspect-square w-full object-cover"
        />
      </div>
    </div>

    <div
      v-if="reviewImagesLoading && resolvedItems.length > 0"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        v-for="skeleton in skeletonItems"
        :key="skeleton"
        class="overflow-hidden rounded-[20px]"
      >
        <USkeleton class="aspect-square w-full rounded-[20px]" />
      </div>
    </div>
  </div>
</template>
