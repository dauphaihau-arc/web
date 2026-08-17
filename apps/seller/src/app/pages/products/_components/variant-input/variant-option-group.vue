<script setup lang="ts">
import { PRODUCT_CONFIG } from '@arc/enums/product'
import type { VariantInputOption } from './variant-input.types'

const groupName = defineModel<string | undefined>('groupName')
const optionName = defineModel<string>('optionName', { default: '' })

defineProps<{
  errorGroupName?: string
  errorOption?: string
  groupNameFieldName?: string
  isActive?: boolean
  limitOptionName?: boolean
  options: VariantInputOption[]
  showCloseButton?: boolean
  showInlineOptionError?: boolean
  showOpenButton?: boolean
  title: string
}>()

defineEmits<{
  add: []
  close: []
  open: []
  remove: [option: VariantInputOption]
  updateName: [option: VariantInputOption, value: string]
}>()
</script>

<template>
  <div class="relative w-1/5">
    <UButton
      v-if="showOpenButton && !isActive"
      class="mb-4"
      icon="i-heroicons-plus"
      color="gray"
      variant="solid"
      @click="$emit('open')"
    >
      Add a variation
    </UButton>

    <div v-else>
      <UButton
        v-if="showCloseButton"
        class="absolute -right-20 -top-4"
        variant="ghost"
        icon="i-heroicons-x-mark"
        color="gray"
        @click="$emit('close')"
      />

      <UFormGroup
        class="mb-4"
        :label="title"
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
        label="Name the option"
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
            v-model="optionName"
            :maxlength="limitOptionName === false ? undefined : PRODUCT_CONFIG.MAX_CHAR_VARIANT_NAME"
          />
          <template v-if="showInlineOptionError">
            {{ errorOption }}
          </template>
          <UButton
            :disabled="!optionName || !!errorOption"
            color="gray"
            variant="solid"
            @click="$emit('add')"
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
                icon="i-heroicons-x-mark"
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
