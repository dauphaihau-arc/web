<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

const props = withDefaults(defineProps<{
  codes: string[]
  error?: string
  disabled?: boolean
  disabledInput?: boolean
  disabledAdd?: boolean
}>(), {
  error: '',
  disabled: false,
  disabledInput: false,
  disabledAdd: false,
})

const emit = defineEmits<{
  apply: []
  removeCode: [code: string]
  toggle: []
}>()

const code = defineModel<string>('code', { required: true })
const showInput = defineModel<boolean>('showInput', { required: true })
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['ticket']"
      color="gray"
      class="mb-2 w-fit"
      :disabled="props.disabled"
      @click="emit('toggle')"
    >
      Apply shop coupon codes
    </UButton>

    <div
      v-if="showInput"
      class="mb-4 flex gap-3"
    >
      <UFormGroup
        required
        name="code"
        :error="props.error"
      >
        <UButtonGroup orientation="horizontal">
          <UInput
            v-model="code"
            v-uppercase
            :disabled="props.disabledInput || props.disabled"
          />
          <UButton
            color="gray"
            variant="solid"
            :disabled="props.disabledAdd || props.disabled"
            @click="emit('apply')"
          >
            Add
          </UButton>
        </UButtonGroup>
      </UFormGroup>

      <div
        v-if="props.codes.length > 0"
        class="flex gap-3"
      >
        <div
          v-for="(appliedCode, index) of props.codes"
          :key="index"
        >
          <div class="relative">
            <UButton color="gray">
              {{ appliedCode }}
            </UButton>
            <UButton
              class="absolute -right-2 -top-3 z-[1]"
              size="2xs"
              color="gray"
              variant="solid"
              :disabled="props.disabled"
              :icon="ICON_NAME_BY_ALIAS['xMarkSolid']"
              :ui="{ rounded: 'rounded-full' }"
              @click="emit('removeCode', appliedCode)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
