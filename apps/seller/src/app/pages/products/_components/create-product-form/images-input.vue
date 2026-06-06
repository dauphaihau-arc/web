<script setup lang="ts">
import { PRODUCT_CONFIG } from '@arc/enums/product'
import { toastCustom } from '~/shared/config/toast'

const model = defineModel<File[]>({
  required: true,
})

const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)

const state = reactive({
  fileImages: [] as File[],
  urlImages: [] as string[],
})

const onPickFile = () => {
  fileInputRef?.value?.click()
}

function onFilePicked(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files as FileList

  if (
    files.length > PRODUCT_CONFIG.MAX_IMAGES
    || files.length + state.urlImages.length > PRODUCT_CONFIG.MAX_IMAGES
  ) {
    toast.add({
      ...toastCustom.error,
      title: 'Upload failed',
      description: `You only have ${PRODUCT_CONFIG.MAX_IMAGES - state.fileImages.length} images left to upload`,
    })
    return
  }

  for (let i = 0; i < files.length; i++) {
    state.fileImages.push(files[i])
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      state.urlImages.push(reader.result as string)
    })
    reader.readAsDataURL(files[i])
  }
}

const removeImage = (index: number) => {
  state.fileImages.splice(index, 1)
  state.urlImages.splice(index, 1)
}

watch(state, () => {
  model.value = state.fileImages
})
</script>

<template>
  <UFormGroup
    label="Photos"
    name="photos"
    :description="`Add up to ${PRODUCT_CONFIG.MAX_IMAGES} photos.`"
    required
  >
    <div class="flex flex-wrap gap-3">
      <div
        v-for="(url, index) in state.urlImages"
        :key="url"
        class="size-image"
      >
        <div
          class="group relative"
          @click="removeImage(index)"
        >
          <NuxtImg
            :src="url"
            class="size-image"
          />
          <div class="wrapper-close-icon">
            <UIcon
              name="i-material-symbols:cancel-rounded"
              class="size-full p-12 text-white"
            />
          </div>
          <UBadge
            v-if="index === 0"
            class="absolute bottom-3 right-3"
            size="sm"
          >
            Primary
          </UBadge>
        </div>
      </div>

      <div
        class="wrapper-input-file"
        @click="onPickFile"
      >
        <AppIcon
          name="camera"
          class="w-full"
        />
        <p>Add a photo</p>
        <input
          id="formFile"
          ref="fileInputRef"
          class="hidden"
          type="file"
          multiple
          :disabled="state.urlImages.length === PRODUCT_CONFIG.MAX_IMAGES"
          accept="image/*"
          @change="onFilePicked"
        >
      </div>
    </div>
  </UFormGroup>
</template>

<style scoped>
.rounded-shape {
  @apply rounded-xl;
}

.size-image {
  @apply h-[145px] w-[145px] rounded-shape;
}

.wrapper-input-file {
  @apply size-image border-dashed border-4 border-border-muted
  cursor-pointer grid place-content-center text-center;
}
.wrapper-close-icon {
  @apply
  rounded-shape
  transform duration-200 ease-in-out
  absolute z-[2] group-hover:block hidden
  inset-0
  w-full h-full
  hover:bg-black
  opacity-30
  grid place-content-center
  cursor-pointer;
}
</style>
