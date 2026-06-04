<script lang="ts" setup>
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'

const { images } = defineProps<{
  images: GetDetailProductBySlugResponse['images']
}>()

const config = useRuntimeConfig()
const selectedImg = ref(0)
const previewImg = ref<number | null>(null)

const currentImg = computed(() => previewImg.value ?? selectedImg.value)

const selectedImage = computed(() => images[currentImg.value])

const imageUrlSelected = computed(() => {
  return resolveProductImageUrl(
    selectedImage.value,
    config.public.assetHost,
  )
})

const imageThumbSelected = (index: number) => {
  return resolveProductImageUrl(
    images[index],
    config.public.assetHost,
    'thumb_1x1',
  )
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
  if (selectedImg.value === images.length - 1) {
    return
  }
  selectedImg.value++
  previewImg.value = null
}
</script>

<template>
  <div class="flex gap-6">
    <div
      class="flex w-fit flex-col gap-3"
      @mouseleave="onResetPreviewImg"
    >
      <div
        v-for="(image, index) of images"
        :key="image.id"
      >
        <button
          type="button"
          :class="[
            'block rounded  bg-zinc-200 ring-2 ring-transparent',
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
            width="100"
            height="100"
            class="rounded"
          />
        </button>
      </div>
    </div>
    <div class="relative w-[575px] max-w-full overflow-hidden rounded bg-zinc-100">
      <NuxtImg
        preload
        :src="imageUrlSelected"
        width="575"
        class="h-auto w-full rounded"
      />
      <div
        class="arrow absolute bottom-3 right-16"
        @click="onSelectPrevImg"
      >
        <AppIcon
          name="arrowLeft"
          class="text-black"
        />
      </div>
      <div
        class="arrow absolute bottom-3 right-3"
        @click="onSelectNextImg"
      >
        <AppIcon
          name="arrowForward"
          class="text-black"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.arrow {
  @apply cursor-pointer bg-white rounded-full p-4
  h-10 w-10 grid place-content-center;
}
</style>
