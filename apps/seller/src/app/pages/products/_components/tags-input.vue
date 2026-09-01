<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PRODUCT_CONFIG } from '@arc/enums/product'

const tagsModel = defineModel<string[]>({
  default: [],
})

const state = reactive({
  input: '',
  errorMsgInput: '',
})

const tagInputRef = ref()

const isAddTagDisabled = computed(() =>
  !state.input
  || Boolean(state.errorMsgInput)
  || tagsModel.value.length === PRODUCT_CONFIG.MAX_TAGS
  || tagsModel.value.includes(state.input),
)

const addTag = async () => {
  if (isAddTagDisabled.value) {
    return
  }

  tagsModel.value = [...tagsModel.value, state.input]
  state.input = ''
  await nextTick()
  tagInputRef.value?.input?.focus()
}

const removeTag = (index: number) => {
  tagsModel.value = tagsModel.value.filter((_, currentIndex) => currentIndex !== index)
}

watchDebounced(
  () => state.input,
  () => {
    state.errorMsgInput = ''
    if (tagsModel.value.includes(state.input)) {
      state.errorMsgInput = 'Duplicate'
    }
  },
  { debounce: 300, maxWait: 1000 },
)
</script>

<template>
  <div v-if="tagsModel">
    <UFormGroup
      class="mb-4 max-w-[20%]"
      label="Tags"
      :description="`Add up to ${PRODUCT_CONFIG.MAX_TAGS} tags.`"
      :error="state.errorMsgInput ?? ''"
    >
      <UButtonGroup
        size="lg"
        orientation="horizontal"
      >
        <UInput
          ref="tagInputRef"
          v-model="state.input"
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_TAG"
          :disabled="tagsModel.length === PRODUCT_CONFIG.MAX_TAGS"
          @keydown.enter.prevent="addTag"
        />
        <UButton
          :disabled="isAddTagDisabled"
          type="button"
          color="gray"
          variant="solid"
          @click="addTag"
        >
          Add
        </UButton>
      </UButtonGroup>
    </UFormGroup>
    <div
      v-if="tagsModel.length > 0"
      class="flex w-full flex-wrap gap-x-4"
    >
      <div
        v-for="(tag, index) of tagsModel"
        :key="tag"
      >
        <UFormGroup class="mb-4">
          <UButtonGroup
            v-if="tag !== undefined"
            size="lg"
            orientation="horizontal"
          >
            <UButton
              disabled
              :label="tag"
              color="white"
            />
            <UButton
              type="button"
              :icon="ICON_NAME_BY_ALIAS['xMark']"
              color="gray"
              @click="removeTag(index)"
            />
          </UButtonGroup>
        </UFormGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
