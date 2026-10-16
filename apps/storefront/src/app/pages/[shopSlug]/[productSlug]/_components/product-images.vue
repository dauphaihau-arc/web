<script lang="ts" setup>
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract'
import { resolveProductImageUrl } from '~/domains/product/utils/product-image-url'

type CarouselExposed = {
  page?: number
  prev?: () => void
  next?: () => void
}

const props = withDefaults(defineProps<{
  images?: GetDetailProductBySlugResponse['images']
  isLoading?: boolean
}>(), {
  images: () => [],
  isLoading: false,
})

const config = useRuntimeConfig()

// Desktop gallery state.
const selectedImg = ref(0)
const previewImg = ref<number | null>(null)
const imageThumbRefs = ref<HTMLElement[]>([])

const currentImg = computed(() => previewImg.value ?? selectedImg.value)

const selectedImage = computed(() => props.images[currentImg.value])

const imageUrlSelected = computed(() => {
  if (!selectedImage.value) {
    return ''
  }

  return resolveProductImageUrl(
    selectedImage.value,
    config.public.assetHost,
    'pdp_contain',
  )
})

const imageThumbSelected = (index: number) => {
  return resolveProductImageUrl(
    props.images[index],
    config.public.assetHost,
    'thumb_1x1',
  )
}

const setImageThumbRef = (element: unknown, index: number) => {
  if (element instanceof HTMLElement) {
    imageThumbRefs.value[index] = element
  }
}

const onPreviewImg = (index: number) => {
  previewImg.value = index
}

const onResetPreviewImg = () => {
  previewImg.value = null
}

const onSelectImg = (index: number) => {
  selectedImg.value = index
  previewImg.value = null
}

const onSelectPrevImg = () => {
  if (!selectedImg.value) {
    return
  }
  selectedImg.value--
  previewImg.value = null
}

const onSelectNextImg = () => {
  if (selectedImg.value === props.images.length - 1) {
    return
  }
  selectedImg.value++
  previewImg.value = null
}

onBeforeUpdate(() => {
  imageThumbRefs.value = []
})

watch(selectedImg, async () => {
  await nextTick()

  imageThumbRefs.value[selectedImg.value]?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
})

// Mobile/tablet carousel state.
const carousel = ref<CarouselExposed | null>(null)

const imageUrl = (index: number) => {
  const image = props.images[index]
  return image ? resolveProductImageUrl(image, config.public.assetHost, 'pdp_contain') : ''
}

/**
 * Below `lg` the track bleeds to both viewport edges while the container owns
 * the page gutter as inline padding, so the first slide starts on the same left
 * edge as the breadcrumb and the neighbouring image stays visible in the
 * trailing gutter. There is no thumbnail rail or chevron there.
 *
 * `items-start` keeps the slide from stretching to the track's line height,
 * which would cancel the frame's `aspect-[1/1]`.
 */
const carouselUi = {
  container: 'px-4 md:px-12 scroll-px-4 md:scroll-px-12',
  item: 'w-full snap-start items-start pe-3',
}

// UCarousel exposes the current page as a 1-based number.
watch(() => carousel.value?.page, (page) => {
  if (typeof page !== 'number' || page < 1) {
    return
  }

  selectedImg.value = page - 1
})
</script>

<template>
  <div
    v-if="props.isLoading"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="hidden gap-6 lg:flex">
      <div class="flex w-fit flex-col gap-3">
        <USkeleton
          v-for="index in 4"
          :key="index"
          class="size-[100px] rounded !bg-customGray-300/85"
        />
      </div>
      <USkeleton class="aspect-[1/1] w-[575px] max-w-full rounded !bg-customGray-300/85" />
    </div>

    <div class="-mx-4 px-4 md:-mx-12 md:px-12 lg:hidden">
      <div class="pe-3">
        <USkeleton class="aspect-[1/1] w-full rounded !bg-customGray-300/85" />
      </div>
    </div>
  </div>

  <div v-else>
    <div class="hidden gap-6 lg:flex">
      <div
        class="scrollbar-hidden scroll-fade flex h-[575px] w-fit flex-col gap-3 overflow-y-auto p-1"
        @mouseleave="onResetPreviewImg"
      >
        <div
          v-for="(image, index) of props.images"
          :key="image.id"
        >
          <button
            :ref="element => setImageThumbRef(element, index)"
            type="button"
            :class="[
              'block rounded bg-media-product ring-2 ring-transparent',
              {
                '!ring-primary': selectedImg === index,
              }]"
            @mouseenter="onPreviewImg(index)"
            @focus="onPreviewImg(index)"
            @blur="onResetPreviewImg"
            @click="onSelectImg(index)"
          >
            <NuxtImg
              preload
              :src="imageThumbSelected(index)"
              densities="1"
              width="90"
              height="90"
              class="rounded"
            />
          </button>
        </div>
      </div>

      <div class="relative size-[575px] max-w-full overflow-hidden rounded bg-media-product">
        <NuxtImg
          preload
          :src="imageUrlSelected"
          densities="1"
          width="575"
          height="575"
          class="absolute inset-0 size-full rounded object-contain"
        />
        <template v-if="props.images.length > 1">
          <div
            class="arrow absolute bottom-3 right-16"
            @click="onSelectPrevImg"
          >
            <AppIcon
              name="chevronLeft"
              class="text-black"
            />
          </div>
          <div
            class="arrow absolute bottom-3 right-3"
            @click="onSelectNextImg"
          >
            <AppIcon
              name="chevronRight"
              class="text-black"
            />
          </div>
        </template>
      </div>
    </div>

    <div class="-mx-4 md:-mx-12 lg:hidden">
      <UCarousel
        ref="carousel"
        :items="props.images"
        :ui="carouselUi"
      >
        <template #default="{ index }">
          <div class="relative aspect-[1/1] w-full overflow-hidden rounded bg-media-product">
            <NuxtImg
              :src="imageUrl(index)"
              densities="1"
              width="575"
              height="575"
              class="absolute inset-0 size-full object-contain"
            />
          </div>
        </template>
      </UCarousel>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.arrow {
  @apply cursor-pointer bg-surface rounded-full p-4
  h-10 w-10 grid place-content-center;
}
</style>
