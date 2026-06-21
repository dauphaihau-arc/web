<script lang="ts" setup>
import type { GetPublicProductReviewsResponse } from '~/shared/api/product/contracts/product.contract'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'

const props = defineProps<{
  reviews: GetPublicProductReviewsResponse
  page: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:page': [value: number]
}>()

const config = useRuntimeConfig()
const visibleReviews = computed(() => props.reviews.items)
const shouldShowPagination = computed(() => props.reviews.meta.total > props.reviews.meta.limit)
const skeletonCount = computed(() => Math.max(1, props.reviews.meta.limit || 4))

function formatReviewDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getReviewDateLabel(review: GetPublicProductReviewsResponse['items'][number]) {
  const createdAt = typeof review.created_at === 'string'
    ? new Date(review.created_at)
    : review.created_at
  const updatedAt = typeof review.updated_at === 'string'
    ? new Date(review.updated_at)
    : review.updated_at

  if (updatedAt.getTime() > createdAt.getTime()) {
    return `Updated ${formatReviewDate(updatedAt)}`
  }

  return formatReviewDate(createdAt)
}

function getAuthorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U'
}

function getReviewImageSrc(review: GetPublicProductReviewsResponse['items'][number]) {
  if (!review.image) {
    return null
  }

  return resolveProductImageUrl(review.image, config.public.assetHost, 'thumb_1x1')
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="isLoading"
      class="space-y-0"
      aria-busy="true"
      aria-live="polite"
    >
      <article
        v-for="index in skeletonCount"
        :key="index"
        class="border-t border-border-subtle py-4 first:border-t-0 first:pt-0"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USkeleton class="h-4 w-24" />
                <USkeleton class="h-6 w-8" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <USkeleton class="size-7 rounded-full" />
              <div class="space-y-2">
                <USkeleton class="h-3 w-24" />
                <USkeleton class="h-3 w-20" />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-4 w-full max-w-4xl" />
            <USkeleton class="h-4 w-4/5 max-w-3xl" />
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="space-y-0"
    >
      <div
        v-if="visibleReviews.length === 0"
        class="rounded-3xl border border-border-subtle bg-surface-muted px-6 py-8 text-sm text-text-muted"
      >
        No reviews match the selected filters.
      </div>

      <article
        v-for="review in visibleReviews"
        :key="review.id"
        class="border-t border-border-subtle py-4 first:border-t-0 first:pt-0"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="w-full space-y-1">
            <div class="flex justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-1 text-rating-star">
                  <AppIcon
                    v-for="index in 5"
                    :key="index"
                    name="star"
                    size="xs"
                    :class="index <= review.rating ? 'opacity-100' : 'opacity-25'"
                  />
                </div>
                <div class="text-lg font-semibold leading-none text-text">
                  {{ review.rating }}
                </div>
              </div>

              <div class="flex items-center gap-2 text-right">
                <div class="flex items-center gap-1">
                  <div class="grid size-5 shrink-0 place-items-center rounded-full bg-customGray-200 text-xs font-semibold text-text-strong">
                    {{ getAuthorInitial(review.author.display_name) }}
                  </div>
                  <div class="text-[12px] font-semibold text-text">
                    {{ review.author.display_name }}
                  </div>
                </div>
                <UDivider
                  orientation="vertical"
                  class="h-5"
                />
                <div class="text-[12px] text-text-muted">
                  {{ getReviewDateLabel(review) }}
                </div>
              </div>
            </div>

            <div class="flex justify-between gap-4">
              <div class="space-y-1">
                <h3
                  v-if="review.title"
                  class="text-sm font-semibold text-text"
                >
                  {{ review.title }}
                </h3>
                <p class="max-w-4xl text-sm text-text">
                  {{ review.body || 'Customer left a star rating for this item.' }}
                </p>
              </div>

              <NuxtImg
                v-if="getReviewImageSrc(review)"
                :src="getReviewImageSrc(review) ?? undefined"
                :alt="review.title || `Review photo from ${review.author.display_name}`"
                width="176"
                height="176"
                class="size-24 shrink-0 rounded-2xl bg-surface-muted object-cover md:size-16"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <div class="flex justify-center">
      <UPagination
        v-if="shouldShowPagination"
        :model-value="page"
        :total="reviews.meta.total"
        :page-count="reviews.meta.limit"
        :inactive-button="{ color: 'gray' }"
        @update:model-value="emit('update:page', $event)"
      />
    </div>
  </div>
</template>
