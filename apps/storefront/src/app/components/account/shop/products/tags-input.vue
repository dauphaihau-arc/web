<script setup lang="ts">
import { PRODUCT_CONFIG } from '~/shared/config/enums/product'

const tagsModel = defineModel<string[]>({
  default: [],
  required: true,
})

const state = reactive({
  input: '',
  errorMsgInput: '',
})

const addTag = () => {
  tagsModel.value = [...tagsModel.value, state.input]
  state.input = ''
}

const removeTag = (index: number) => {
  tagsModel.value = tagsModel.value.toSpliced(index, 1)
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
          v-model="state.input"
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_TAG"
          :disabled="tagsModel.length === PRODUCT_CONFIG.MAX_TAGS"
        />
        <UButton
          :disabled=" !state.input || Boolean(state.errorMsgInput)"
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
            v-if="tag"
            size="lg"
            orientation="horizontal"
          >
            <UButton
              disabled
              :label="tag"
              color="white"
            />
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              @click="() => removeTag(index)"
            />
          </UButtonGroup>
        </UFormGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
