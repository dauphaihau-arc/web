<script setup lang="ts">
import { PRODUCT_CONFIG } from '@arc/enums/product'
import type { ProductImageReference } from '~/shared/api/shop/product/contracts/form.contract'
import { toastCustom } from '~/shared/config/toast'

type PersistedImage = Required<Pick<ProductImageReference, 'id' | 'relative_url'>> & {
  rank?: number
}

const props = withDefaults(
  defineProps<{
    countValidate: number
    loading: boolean
    images: PersistedImage[]
  }>(),
  {
    images: () => [],
  },
)

const fileImages = defineModel<File[]>('newFileImages', {
  default: [],
})

const idsImageForDelete = defineModel<Required<Pick<ProductImageReference, 'id'>>[]>('idsImageDelete', {
  default: [],
})

const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)

const state = reactive({
  urlImages: [] as string[],
  imagesInDB: [...props.images],
  // fileImages: [] as File[],
  // idsImagesForDelete: [] as ProductImage['id'][],
})

const onPickFile = () => {
  fileInputRef?.value?.click()
}

function onFilePicked(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files as FileList
  const totalImagesCurrent = state.urlImages.length + state.imagesInDB.length
  if (
    files.length > PRODUCT_CONFIG.MAX_IMAGES
    || files.length + totalImagesCurrent > PRODUCT_CONFIG.MAX_IMAGES
  ) {
    toast.add({
      ...toastCustom.error,
      title: 'Upload failed',
      description: `You only have ${PRODUCT_CONFIG.MAX_IMAGES - totalImagesCurrent} images left to upload`,
    })
    return
  }
  for (let i = 0; i < files.length; i++) {
    // state.fileImages.push(files[i]);
    fileImages.value = [...fileImages.value, files[i]]
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      state.urlImages.push(reader.result as string)
    })
    reader.readAsDataURL(files[i])
  }
}

const removeImage = (index: number) => {
  fileImages.value = fileImages.value.toSpliced(index, 1)
  state.urlImages.splice(index, 1)
  // state.fileImages.splice(index, 1);
}

const removeImageInDB = (id: string, index: number) => {
  state.imagesInDB.splice(index, 1)
  // state.idsImagesForDelete.push(id);
  idsImageForDelete.value = [...idsImageForDelete.value, { id }]
}

// watch(state, () => {
//   emit('onChange', {
//     fileImages: state.fileImages,
//     idsImagesForDelete: state.idsImagesForDelete,
//   });
// });
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
        v-for="(img, index) in state.imagesInDB"
        :key="img.id"
        class="size-image"
      >
        <div
          class="group relative"
          @click="removeImageInDB(img.id, index)"
        >
          <NuxtImg
            :src="`/assetHost/${img?.relative_url}`"
            class="size-image"
          />
          <div
            v-if="!props.loading"
            class="wrapper-close-icon"
          >
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
          <div
            v-if="!props.loading"
            class="wrapper-close-icon"
          >
            <UIcon
              name="i-material-symbols:cancel-rounded"
              class="size-full p-12 text-white"
            />
          </div>
          <UBadge
            v-if="state.imagesInDB.length === 0 && index === 0"
            class="absolute bottom-3 right-3"
            size="sm"
          >
            Primary
          </UBadge>
        </div>
      </div>

      <div
        class="wrapper-input-file"
        :class="[props.loading ? 'cursor-wait' : 'cursor-pointer']"
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
          :disabled="state.urlImages.length + state.imagesInDB.length === PRODUCT_CONFIG.MAX_IMAGES"
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
  @apply size-image border-dashed border-4 border-zinc-300
  grid place-content-center text-center;
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
