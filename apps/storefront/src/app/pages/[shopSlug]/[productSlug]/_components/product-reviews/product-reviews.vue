<script lang="ts" setup>
import ProductReviewImages from './product-review-images.vue'
import ProductReviewList from './product-review-list.vue'
import ProductReviewsSkeleton from './product-reviews-skeleton.vue'
import { useGetPublicProductReviews } from '~/shared/server-state/product/reviews.query'

type ReviewRatingFilter = 1 | 2 | 3 | 4 | 5

const props = defineProps<{
  shopSlug: string
  productSlug: string
  isLoading?: boolean
}>()

const reviewPage = ref(1)
const reviewLimit = 4
const reviewRating = ref<ReviewRatingFilter>()
const reviewHasComment = ref(false)

const reviewQueryParams = computed(() => ({
  page: reviewPage.value,
  limit: reviewLimit,
  ...(reviewRating.value ? { rating: reviewRating.value } : {}),
  ...(reviewHasComment.value ? { has_comment: true } : {}),
}))

const {
  data: reviews,
  isPending: reviewsLoading,
} = useGetPublicProductReviews(props.shopSlug, props.productSlug, reviewQueryParams)

const reviewAverage = computed(() => Number(reviews.value?.summary.average || 0))
const reviewCount = computed(() => Number(reviews.value?.summary.count || 0))

const ratingOptions: ReviewRatingFilter[] = [5, 4, 3, 2, 1]

const averageLabel = computed(() => reviewAverage.value.toFixed(1))

const reviewCountLabel = computed(() => {
  const count = reviewCount.value
  return `${count} review${count === 1 ? '' : 's'}`
})

function getRatingCount(rating: ReviewRatingFilter) {
  return reviews.value?.summary.breakdown[rating] ?? 0
}

function toggleRating(rating: ReviewRatingFilter) {
  reviewRating.value = reviewRating.value === rating ? undefined : rating
  reviewPage.value = 1
}

function toggleHasComment() {
  reviewHasComment.value = !reviewHasComment.value
  reviewPage.value = 1
}

watch(
  () => [props.shopSlug, props.productSlug],
  () => {
    reviewPage.value = 1
    reviewRating.value = undefined
    reviewHasComment.value = false
  },
)
</script>

<template>
  <div>
    <ProductReviewsSkeleton v-if="props.isLoading" />

    <section
      v-else-if="reviewCount > 0 && reviews"
      id="reviews"
      class="space-y-5 py-10"
    >
      <div class="space-y-5">
        <h2 class="text-xl font-semibold tracking-tight text-text">
          Reviews for this item
        </h2>

        <div class="flex items-center gap-4">
          <div class="flex gap-3">
            <div class="text-4xl font-semibold leading-none text-text">
              {{ averageLabel }}
            </div>
            <div class="flex items-center gap-1 text-rating-star">
              <AppIcon
                name="star"
                size="xl"
              />
            </div>
          </div>
          <div>
            <div class="text-base font-medium text-text">
              Item average
            </div>
            <div class="text-sm text-text-muted">
              {{ reviewCountLabel }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <!-- <div>
          <UButton
            variant="solid"
            size="md"
            :color="hasImages ? 'primary' : 'gray'"
            class="transition"
            @click="toggleHasImages"
          >
            Has Image ({{ reviews?.summary.filters.has_images ?? 0 }})
          </UButton>
        </div> -->

        <div>
          <UButton
            size="md"
            :color="reviewHasComment ? 'primary' : 'gray'"
            class="transition"
            @click="toggleHasComment"
          >
            Has Comment ({{ reviews?.summary.filters.has_comment ?? 0 }})
          </UButton>
        </div>

        <div
          v-for="ratingOption in ratingOptions"
          :key="ratingOption"
        >
          <UButton
            :color="reviewRating === ratingOption ? 'primary' : 'gray'"
            size="md"
            class="transition"
            @click="toggleRating(ratingOption)"
          >
            {{ ratingOption }} Star ({{ getRatingCount(ratingOption) }})
          </UButton>
        </div>
      </div>

      <ProductReviewList
        :reviews="reviews"
        :page="reviewPage"
        :is-loading="reviewsLoading"
        @update:page="reviewPage = $event"
      />

      <ProductReviewImages
        :shop-slug="props.shopSlug"
        :product-slug="props.productSlug"
      />
    </section>
  </div>
</template>
