<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PRODUCT_CONFIG } from '@arc/enums/product'
import {
  ADD_ANOTHER_OPTION_LABEL,
  ADD_OPTION_VALUE_LABEL,
  OPTION_NAME_LABEL,
} from './variant-input.constants'
import type { VariantInputOption } from './variant-input.types'

const groupName = defineModel<string | undefined>('groupName')
const optionName = defineModel<string>('optionName', { default: '' })

const props = defineProps<{
  errorGroupName?: string
  errorOption?: string
  groupNameFieldName?: string
  isActive?: boolean
  limitOptionName?: boolean
  options: VariantInputOption[]
  showCloseButton?: boolean
  showInlineOptionError?: boolean
  showOpenButton?: boolean
  title?: string
}>()

const emit = defineEmits<{
  add: []
  close: []
  open: []
  remove: [option: VariantInputOption]
  updateName: [option: VariantInputOption, value: string]
}>()

const optionNameInputRef = ref()

async function handleAdd() {
  if (!optionName.value || props.errorOption) {
    return
  }

  emit('add')
  await nextTick()
  optionNameInputRef.value?.input?.focus()
}
</script>

<template>
  <div class="relative w-1/5">
    <UButton
      v-if="showOpenButton && !isActive"
      type="button"
      class="mb-4"
      :icon="ICON_NAME_BY_ALIAS['plus']"
      color="gray"
      variant="solid"
      @click="$emit('open')"
    >
      {{ ADD_ANOTHER_OPTION_LABEL }}
    </UButton>

    <div v-else>
      <UButton
        v-if="showCloseButton"
        type="button"
        class="absolute -right-20 -top-4"
        variant="ghost"
        :icon="ICON_NAME_BY_ALIAS['xMark']"
        color="gray"
        @click="$emit('close')"
      />

      <h4
        v-if="title"
        class="text-text mb-3 text-sm font-medium"
      >
        {{ title }}
      </h4>

      <UFormGroup
        class="mb-4"
        :label="OPTION_NAME_LABEL"
        required
        :name="groupNameFieldName"
        :error="errorGroupName ?? ''"
      >
        <template #hint>
          <span class="hint-text-input">
            {{ groupName?.length ?? 0 }}/
            {{ PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME }}
          </span>
        </template>
        <UInput
          v-model="groupName"
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_VARIANT_GROUP_NAME"
          size="lg"
        />
      </UFormGroup>

      <UFormGroup
        class="mb-4"
        :label="ADD_OPTION_VALUE_LABEL"
        required
        :error="errorOption ?? ''"
      >
        <template #hint>
          <span class="hint-text-input">
            {{ optionName.length ?? 0 }}/
            {{ PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME }}
          </span>
        </template>

        <UButtonGroup
          size="lg"
          orientation="horizontal"
        >
          <UInput
            ref="optionNameInputRef"
            v-model="optionName"
            :maxlength="limitOptionName === false ? undefined : PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME"
            placeholder="Enter a value"
            @keydown.enter.prevent="handleAdd"
          />
          <template v-if="showInlineOptionError">
            {{ errorOption }}
          </template>
          <UButton
            type="button"
            :disabled="!optionName || !!errorOption"
            color="gray"
            variant="solid"
            @click="handleAdd"
          >
            Add
          </UButton>
        </UButtonGroup>
      </UFormGroup>

      <div v-if="options.length > 0">
        <div
          v-for="option of options"
          :key="option.id"
        >
          <UFormGroup
            :error="option?.errorMsg ?? ''"
            class="mb-4"
          >
            <UButtonGroup
              v-if="option"
              size="lg"
              orientation="horizontal"
            >
              <UInput
                :model-value="option.variant_name"
                :maxlength="limitOptionName === false ? undefined : PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME"
                @update:model-value="(value: string) => $emit('updateName', option, value)"
              />

              <UButton
                :disabled="options.length === 1"
                :icon="ICON_NAME_BY_ALIAS['xMark']"
                color="gray"
                @click="$emit('remove', option)"
              />
            </UButtonGroup>
          </UFormGroup>
        </div>
      </div>
    </div>
  </div>
</template>
