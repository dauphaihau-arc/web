<script
    setup lang="ts"
    generic="
    TValue extends string | number | boolean,
    TOption extends TValue | Record<string, any>
"
>
import RadioInput from '~/shared/ui/radio-input.vue'

const props = defineProps<{
  options: TOption[]
  disabled?: boolean
  valueAttribute?: keyof TOption
  row?: boolean
}>()

const radioSelectedModel = defineModel<TValue>({
  required: true,
})

const slots = useSlots()

function optionToValue(opt: TOption) {
  if (typeof opt === 'object') {
    if (props.valueAttribute) {
      return opt[props.valueAttribute]
    }
    else if (Object.hasOwn(opt, 'value')) {
      return opt.value
    }
    return ''
  }
  return opt
}

function optionToLabel(opt: TOption) {
  if (typeof opt === 'object' && opt.label) {
    return opt.label
  }
  return optionToValue(opt) as TValue
}
</script>

<template>
  <div :class="props.row ? 'flex items-center space-x-10' : 'space-y-1'">
    <div
      v-for="(opt, idx) in props.options"
      :key="idx"
    >
      <RadioInput
        v-model="radioSelectedModel"
        :value="optionToValue(opt)"
        :label="optionToLabel(opt)"
        :help="typeof opt === 'object' ? opt?.help : ''"
        :disabled="props.disabled"
      >
        <template
          v-if="slots.label"
          #label
        >
          <slot
            name="label"
            :option="opt"
          />
        </template>
      </RadioInput>
    </div>
  </div>
</template>
