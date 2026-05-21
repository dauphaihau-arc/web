<script lang="ts" setup>
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'

const { images } = defineProps<{
  images: GetDetailProductBySlugResponse['images']
}>()

const selectedImg = ref(0)

const image_url_selected = computed(() => {
  return images[selectedImg.value]?.url
})

const onSelectPrevImg = () => {
  if (!selectedImg.value) {
    return
  }
  selectedImg.value--
}

const onSelectNextImg = () => {
  if (selectedImg.value === images.length - 1) {
    return
  }
  selectedImg.value++
}
</script>

<template>
  <div class="flex gap-6">
    <div class="flex w-fit flex-col gap-3">
      <div
        v-for="(image, index) of images"
        :key="image.id"
      >
        <NuxtImg
          preload
          :src="image.url"
          width="100"
          height="100"
          :class="[
            'cursor-pointer rounded',
            {
              'ring-primary rounded ring': selectedImg === index,
            }]"
          @click="() => selectedImg = index"
        />
      </div>
    </div>
    <div class="relative h-fit">
      <NuxtImg
        preload
        :src="image_url_selected"
        width="575"
        height="575"
        class="rounded"
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
