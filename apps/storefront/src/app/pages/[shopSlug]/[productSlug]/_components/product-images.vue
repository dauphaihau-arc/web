<script lang="ts" setup>
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'

const props = withDefaults(defineProps<{
  images?: GetDetailProductBySlugResponse['images']
  isLoading?: boolean
}>(), {
  images: () => [],
  isLoading: false,
})

const config = useRuntimeConfig()
const selectedImg = ref(0)
const previewImg = ref<number | null>(null)

const currentImg = computed(() => previewImg.value ?? selectedImg.value)

const selectedImage = computed(() => props.images[currentImg.value])

const imageUrlSelected = computed(() => {
  if (!selectedImage.value) {
    return ''
  }

  return resolveProductImageUrl(
    selectedImage.value,
    config.public.assetHost,
  )
})

const imageThumbSelected = (index: number) => {
  return resolveProductImageUrl(
    props.images[index],
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
  if (selectedImg.value === props.images.length - 1) {
    return
  }
  selectedImg.value++
  previewImg.value = null
}
</script>

<template>
  <div
    v-if="props.isLoading"
    class="flex gap-6"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="flex w-fit flex-col gap-3">
      <USkeleton
        v-for="index in 4"
        :key="index"
        class="size-[100px] rounded !bg-customGray-300/85"
      />
    </div>
    <USkeleton class="aspect-square w-[575px] max-w-full rounded !bg-customGray-300/85" />
  </div>

  <div
    v-else
    class="flex gap-6"
  >
    <div
      class="flex w-fit flex-col gap-3"
      @mouseleave="onResetPreviewImg"
    >
      <div
        v-for="(image, index) of props.images"
        :key="image.id"
      >
        <button
          type="button"
          :class="[
            'block rounded bg-customGray-200 ring-2 ring-transparent',
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
    <div class="relative h-[575px] w-[575px] max-w-full overflow-hidden rounded bg-surface-muted">
      <NuxtImg
        preload
        :src="imageUrlSelected"
        width="575"
        height="575"
        class="absolute inset-0 h-full w-full rounded object-contain"
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
</template>

<style scoped lang="postcss">
.arrow {
  @apply cursor-pointer bg-surface rounded-full p-4
  h-10 w-10 grid place-content-center;
}
</style>
